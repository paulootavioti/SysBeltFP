import { prisma } from "../../../shared/database/prisma";
import { AppError } from "../../../shared/errors/AppError";
import { garantirAcessoUnidade } from "../../../shared/utils/escopoUnidade";
import { AuditLogService } from "../../../shared/services/AuditLogService";

const auditLogService = new AuditLogService();

export class RegistrarComprovanteService {

  async execute(id: number, unidadeId: number | null, usuarioId: number, comprovanteUrl: string) {

    const mensalidadeExistente = await prisma.mensalidade.findUnique({ where: { id } });

    if (!mensalidadeExistente) {
      throw new AppError("Mensalidade não encontrada.", 404);
    }

    garantirAcessoUnidade(unidadeId, mensalidadeExistente.unidadeId, "Mensalidade não encontrada.");

    const mensalidade = await prisma.mensalidade.update({
      where: { id },
      data: { comprovanteUrl },
    });

    await auditLogService.registrar({
      unidadeId: mensalidadeExistente.unidadeId,
      usuarioId,
      entidade: "Mensalidade",
      entidadeId: mensalidade.id,
      operacao: "ATUALIZACAO",
      valoresAntes: { comprovanteUrl: mensalidadeExistente.comprovanteUrl },
      valoresDepois: { comprovanteUrl: mensalidade.comprovanteUrl },
    });

    return mensalidade;
  }
}
