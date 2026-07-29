import { prisma } from "../../../shared/database/prisma";
import { AppError } from "../../../shared/errors/AppError";
import { garantirAcessoUnidade } from "../../../shared/utils/escopoUnidade";
import { AuditLogService } from "../../../shared/services/AuditLogService";

const auditLogService = new AuditLogService();

interface PagarMensalidadeDTO {
  formaPagamentoId?: number | null;
}

export class PagarMensalidadeService {

  async execute(id: number, unidadeId: number | null, usuarioId: number, dados: PagarMensalidadeDTO = {}) {

    const mensalidadeExistente = await prisma.mensalidade.findUnique({ where: { id } });

    if (!mensalidadeExistente) {
      throw new AppError("Mensalidade não encontrada.", 404);
    }

    garantirAcessoUnidade(unidadeId, mensalidadeExistente.unidadeId, "Mensalidade não encontrada.");

    if (mensalidadeExistente.status === "CANCELADA" || mensalidadeExistente.status === "ESTORNADA") {
      throw new AppError("Não é possível marcar como paga uma mensalidade cancelada ou estornada.");
    }

    const mensalidade =
      await prisma.mensalidade.update({
        where: {
          id
        },
        data: {
          pago: true,
          status: "PAGA",
          dataPagamento: new Date(),
          formaPagamentoId: dados.formaPagamentoId ?? mensalidadeExistente.formaPagamentoId,
        }
      });

    await auditLogService.registrar({
      unidadeId: mensalidadeExistente.unidadeId,
      usuarioId,
      entidade: "Mensalidade",
      entidadeId: mensalidade.id,
      operacao: "PAGAMENTO",
      valoresAntes: mensalidadeExistente,
      valoresDepois: mensalidade,
    });

    return mensalidade;
  }

}
