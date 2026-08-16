import { prismaDaRequisicao } from "../../../shared/database/prismaDaRequisicao";
import { AppError } from "../../../shared/errors/AppError";
import { garantirAcessoUnidade } from "../../../shared/utils/escopoUnidade";
import { AuditLogService } from "../../../shared/services/AuditLogService";

const auditLogService = new AuditLogService();

export class CancelarMensalidadeService {

  async execute(id: number, unidadeId: number | null, usuarioId: number, motivo: string) {
    const prisma = prismaDaRequisicao();

    const mensalidadeExistente = await prisma.mensalidade.findUnique({ where: { id } });

    if (!mensalidadeExistente) {
      throw new AppError("Mensalidade não encontrada.", 404);
    }

    garantirAcessoUnidade(unidadeId, mensalidadeExistente.unidadeId, "Mensalidade não encontrada.");

    if (mensalidadeExistente.status === "PAGA") {
      throw new AppError("Mensalidade já paga não pode ser cancelada — use o estorno.");
    }

    if (mensalidadeExistente.status === "CANCELADA") {
      throw new AppError("Esta mensalidade já está cancelada.");
    }

    const mensalidade = await prisma.mensalidade.update({
      where: { id },
      data: {
        status: "CANCELADA",
        canceladoEm: new Date(),
        motivoCancelamento: motivo,
      },
    });

    await auditLogService.registrar({
      unidadeId: mensalidadeExistente.unidadeId,
      usuarioId,
      entidade: "Mensalidade",
      entidadeId: mensalidade.id,
      operacao: "CANCELAMENTO",
      valoresAntes: mensalidadeExistente,
      valoresDepois: mensalidade,
    });

    return mensalidade;
  }
}
