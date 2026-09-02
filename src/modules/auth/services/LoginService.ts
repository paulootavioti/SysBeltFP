import { prismaDaRequisicao } from "../../../shared/database/prismaDaRequisicao";
import { compare } from "bcryptjs";
import { AppError } from "../../../shared/errors/AppError";
import { assinarTokenDaRequisicao } from "../../../shared/tenant/tokenDaRequisicao";
import { garantirAcessoSuperadminLegado } from "../../../shared/security/superadminLegado";
import { criarSessaoUsuario } from "./criarSessaoUsuario";

interface LoginDTO {
  email: string;
  senha: string;
}

export class LoginService {

  async execute({
    email,
    senha
  }: LoginDTO) {
    const prisma = prismaDaRequisicao();

    const usuario =
      await prisma.usuario.findUnique({
        where: {
          email
        },
        include: {
          unidade: true
        }
      });

    if (!usuario) {
      throw new AppError(
        "Usuário ou senha inválidos."
      );
    }

    if (!usuario.ativo) {
      throw new AppError(
        "Usuário inativo.",
        403
      );
    }

    const senhaCorreta =
      await compare(
        senha,
        usuario.senha
      );

    if (!senhaCorreta) {
      throw new AppError(
        "Usuário ou senha inválidos."
      );
    }

    garantirAcessoSuperadminLegado(usuario.perfil);

    if (usuario.doisFatoresAtivo && usuario.doisFatoresSegredo) {
      const desafio = assinarTokenDaRequisicao(
        { perfil: usuario.perfil, tipo: "desafio-2fa" },
        { subject: String(usuario.id), expiresIn: "5m" },
        "sysbelt-2fa",
      );
      return { requerDoisFatores: true as const, desafio };
    }

    return criarSessaoUsuario(usuario);

  }

}
