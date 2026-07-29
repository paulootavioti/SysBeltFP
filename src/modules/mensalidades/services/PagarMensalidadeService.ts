import { prisma } from "../../../shared/database/prisma";
import { AppError } from "../../../shared/errors/AppError";
import { garantirAcessoUnidade } from "../../../shared/utils/escopoUnidade";
import { AuditLogService } from "../../../shared/services/AuditLogService";
import { calcularValorFinal } from "../utils/calcularValorFinal";

const auditLogService = new AuditLogService();

interface PagarMensalidadeDTO {
  formaPagamentoId?: number | null;
}

export class PagarMensalidadeService {

  async execute(id: number, unidadeId: number | null, usuarioId: number, dados: PagarMensalidadeDTO = {}) {

    const mensalidadeExistente = await prisma.mensalidade.findUnique({
      where: { id },
      include: { assinatura: true },
    });

    if (!mensalidadeExistente) {
      throw new AppError("Mensalidade não encontrada.", 404);
    }

    garantirAcessoUnidade(unidadeId, mensalidadeExistente.unidadeId, "Mensalidade não encontrada.");

    if (mensalidadeExistente.status === "CANCELADA" || mensalidadeExistente.status === "ESTORNADA") {
      throw new AppError("Não é possível marcar como paga uma mensalidade cancelada ou estornada.");
    }

    const agora = new Date();

    // Desconto por pontualidade: só se a mensalidade veio de uma assinatura
    // com esse benefício configurado, e o pagamento acontece até o
    // vencimento (inclusive) — aplicado só agora, no momento do pagamento,
    // nunca na geração da cobrança.
    const pagouEmDia = agora <= mensalidadeExistente.vencimento;
    const descontoPontualidade =
      mensalidadeExistente.assinatura && pagouEmDia ? mensalidadeExistente.assinatura.descontoPontualidade : 0;

    const descontoTotal = mensalidadeExistente.desconto + descontoPontualidade;
    const valorFinal = calcularValorFinal({
      valor: mensalidadeExistente.valorOriginal || mensalidadeExistente.valor,
      desconto: descontoTotal,
      acrescimo: mensalidadeExistente.acrescimo,
      multa: mensalidadeExistente.multa,
      juros: mensalidadeExistente.juros,
    });

    const mensalidade =
      await prisma.mensalidade.update({
        where: {
          id
        },
        data: {
          pago: true,
          status: "PAGA",
          dataPagamento: agora,
          formaPagamentoId: dados.formaPagamentoId ?? mensalidadeExistente.formaPagamentoId,
          desconto: descontoTotal,
          valorFinal,
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
