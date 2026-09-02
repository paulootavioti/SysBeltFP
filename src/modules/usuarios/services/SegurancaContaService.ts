import { compare } from "bcryptjs";
import { prismaDaRequisicao } from "../../../shared/database/prismaDaRequisicao";
import { AppError } from "../../../shared/errors/AppError";
import { cifrar, decifrar } from "../../../shared/security/segredos";
import { criarUriTotp, gerarSegredoTotp, verificarCodigoTotp } from "../../../shared/security/totp";

async function buscarUsuario(usuarioId: number) {
  const usuario = await prismaDaRequisicao().usuario.findUnique({ where: { id: usuarioId } });
  if (!usuario?.ativo) throw new AppError("Usuário não encontrado.", 404);
  return usuario;
}

export class SegurancaContaService {
  async obter(usuarioId: number) {
    const usuario = await buscarUsuario(usuarioId);
    return {
      doisFatoresAtivo: usuario.doisFatoresAtivo,
      doisFatoresAtivadoEm: usuario.doisFatoresAtivadoEm,
      configuracaoPendente: Boolean(usuario.doisFatoresPendente),
    };
  }

  async iniciar(usuarioId: number) {
    const usuario = await buscarUsuario(usuarioId);
    if (usuario.doisFatoresAtivo) throw new AppError("A verificação em duas etapas já está ativa.");

    const segredo = gerarSegredoTotp();
    await prismaDaRequisicao().usuario.update({
      where: { id: usuarioId },
      data: { doisFatoresPendente: cifrar(segredo) },
    });
    return { segredo, uri: criarUriTotp(segredo, usuario.email) };
  }

  async confirmar(usuarioId: number, codigo: string) {
    const usuario = await buscarUsuario(usuarioId);
    if (!usuario.doisFatoresPendente) throw new AppError("Inicie a configuração antes de confirmar o código.");
    const segredo = decifrar(usuario.doisFatoresPendente);
    if (!verificarCodigoTotp(segredo, codigo)) throw new AppError("Código de verificação inválido.");

    await prismaDaRequisicao().usuario.update({
      where: { id: usuarioId },
      data: {
        doisFatoresAtivo: true,
        doisFatoresSegredo: usuario.doisFatoresPendente,
        doisFatoresPendente: null,
        doisFatoresAtivadoEm: new Date(),
      },
    });
    return { doisFatoresAtivo: true };
  }

  async desativar(usuarioId: number, senha: string, codigo: string) {
    const usuario = await buscarUsuario(usuarioId);
    if (!usuario.doisFatoresAtivo || !usuario.doisFatoresSegredo) {
      throw new AppError("A verificação em duas etapas não está ativa.");
    }
    if (!(await compare(senha, usuario.senha))) throw new AppError("Senha atual inválida.", 401);
    if (!verificarCodigoTotp(decifrar(usuario.doisFatoresSegredo), codigo)) {
      throw new AppError("Código de verificação inválido.", 401);
    }

    await prismaDaRequisicao().usuario.update({
      where: { id: usuarioId },
      data: {
        doisFatoresAtivo: false,
        doisFatoresSegredo: null,
        doisFatoresPendente: null,
        doisFatoresAtivadoEm: null,
      },
    });
    return { doisFatoresAtivo: false };
  }
}
