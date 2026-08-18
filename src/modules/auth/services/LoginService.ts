import { prismaDaRequisicao } from "../../../shared/database/prismaDaRequisicao";
import { compare } from "bcryptjs";
import { SignOptions } from "jsonwebtoken";
import { AppError } from "../../../shared/errors/AppError";
import { assinarTokenDaRequisicao } from "../../../shared/tenant/tokenDaRequisicao";
import { garantirAcessoSuperadminLegado } from "../../../shared/security/superadminLegado";

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
// Antes de validar a senha
//if (!usuario.ativo) {
//   throw new AppError(
//     "Usuário inativo."
//   );
// }
    // Sem refresh token de propósito: ensureAuthenticated já revalida o
    // usuário (existência + ativo) no banco a cada requisição, então um
    // token vazado só é útil até um admin desativar a conta em Usuários —
    // não até a expiração natural. Se quiser uma janela mais curta,
    // ajuste JWT_EXPIRES_IN nas variáveis de ambiente (não precisa mexer
    // no código).
    const jwtExpiresIn =
      (process.env.JWT_EXPIRES_IN || "7d") as SignOptions["expiresIn"];

    const token = assinarTokenDaRequisicao(
      {
        perfil: usuario.perfil
      },
      {
        subject: String(usuario.id),
        expiresIn: jwtExpiresIn
      },
      "sysbelt-web",
    );

    // O DONO não é fixado a uma unidade (RN-164) e a autenticação zera a
    // unidade ativa dele a cada requisição. A sessão precisa dizer a mesma
    // coisa: devolvendo a filial gravada, o seletor exibiria "Alfa Zona Sul"
    // enquanto a tela lista a academia inteira.
    const semUnidadeFixa = usuario.perfil === "DONO";

    return {
      usuario: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        perfil: usuario.perfil,
        unidadeId: semUnidadeFixa ? null : usuario.unidadeId,
        unidadeNome: semUnidadeFixa ? null : (usuario.unidade?.nome ?? null)
      },
      token
    };

  }

}
