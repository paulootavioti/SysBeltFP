import { prismaDaRequisicao } from "../../../shared/database/prismaDaRequisicao";
import { AppError } from "../../../shared/errors/AppError";
import { decifrar } from "../../../shared/security/segredos";
import { verificarCodigoTotp } from "../../../shared/security/totp";
import { verificarTokenDaRequisicao } from "../../../shared/tenant/tokenDaRequisicao";
import { garantirAcessoSuperadminLegado } from "../../../shared/security/superadminLegado";
import { criarSessaoUsuario } from "./criarSessaoUsuario";

type DesafioPayload = { sub: string; tipo: string };

export class ConcluirLoginDoisFatoresService {
  async execute(desafio: string, codigo: string) {
    let payload: DesafioPayload;
    try {
      payload = verificarTokenDaRequisicao<DesafioPayload>(desafio, "sysbelt-2fa");
    } catch {
      throw new AppError("O desafio de verificação expirou. Entre novamente.", 401);
    }
    if (payload.tipo !== "desafio-2fa") throw new AppError("Desafio de verificação inválido.", 401);

    const usuario = await prismaDaRequisicao().usuario.findUnique({
      where: { id: Number(payload.sub) },
      include: { unidade: true },
    });
    if (!usuario?.ativo || !usuario.doisFatoresAtivo || !usuario.doisFatoresSegredo) {
      throw new AppError("Verificação em duas etapas indisponível.", 401);
    }
    garantirAcessoSuperadminLegado(usuario.perfil);
    if (!verificarCodigoTotp(decifrar(usuario.doisFatoresSegredo), codigo)) {
      throw new AppError("Código de verificação inválido.", 401);
    }
    return criarSessaoUsuario(usuario);
  }
}
