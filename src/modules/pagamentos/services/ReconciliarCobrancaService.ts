import { prismaDaRequisicao } from "../../../shared/database/prismaDaRequisicao";
import { AppError } from "../../../shared/errors/AppError";
import { AuditLogService } from "../../../shared/services/AuditLogService";
import { garantirAcessoUnidade } from "../../../shared/utils/escopoUnidade";
import { obterGateway } from "../gateways";

const auditLog = new AuditLogService();

export class ReconciliarCobrancaService {
  async execute(id: number, unidadeId: number | null, usuarioId: number) {
    const prisma = prismaDaRequisicao();
    const cobranca = await prisma.cobrancaPagamento.findUnique({
      where: { id },
      include: { mensalidade: true, pedido: true, formaPagamento: true },
    });

    if (!cobranca) throw new AppError("Cobrança não encontrada.", 404);
    garantirAcessoUnidade(unidadeId, cobranca.unidadeId, "Cobrança não encontrada.");
    if (!cobranca.gatewayId) throw new AppError("A tentativa não chegou a ser criada no gateway.");

    const gateway = obterGateway(
      cobranca.formaPagamento?.tipo ?? "OUTRO",
      cobranca.formaPagamento?.configuracao
    );
    const statusExterno = await gateway.consultarStatus(cobranca.gatewayId);
    const status = normalizarStatus(statusExterno);
    const agora = new Date();

    await prisma.$transaction(async (tx) => {
      await tx.cobrancaPagamento.update({
        where: { id },
        data: {
          status,
          consultadoEm: agora,
          reconciliadoEm: status === "PAGO" ? agora : null,
          erro: null,
        },
      });

      if (status === "PAGO" && cobranca.mensalidade && cobranca.mensalidade.status !== "PAGA") {
        if (["CANCELADA", "ESTORNADA"].includes(cobranca.mensalidade.status)) {
          throw new AppError("Pagamento aprovado para mensalidade cancelada ou estornada; trate manualmente.");
        }

        await tx.mensalidade.update({
          where: { id: cobranca.mensalidadeId! },
          data: { status: "PAGA", dataPagamento: agora },
        });
      }

      if (status === "PAGO" && cobranca.pedido?.status === "AGUARDANDO_PAGAMENTO") {
        await tx.pedido.update({
          where: { id: cobranca.pedido.id },
          data: { status: "AGUARDANDO_RETIRADA", pagoEm: agora },
        });
      }
    });

    if (status === "PAGO" && cobranca.mensalidade && cobranca.mensalidade.status !== "PAGA") {
      await auditLog.registrar({
        unidadeId: cobranca.unidadeId,
        usuarioId,
        entidade: "Mensalidade",
        entidadeId: cobranca.mensalidadeId!,
        operacao: "PAGAMENTO",
        valoresAntes: { status: cobranca.mensalidade.status },
        valoresDepois: { status: "PAGA", origem: "conciliacao", gatewayId: cobranca.gatewayId },
      });
    }

    if (status === "PAGO" && cobranca.pedido?.status === "AGUARDANDO_PAGAMENTO") {
      await auditLog.registrar({
        unidadeId: cobranca.unidadeId, usuarioId, entidade: "Pedido", entidadeId: cobranca.pedido.id,
        operacao: "PAGAMENTO", valoresAntes: { status: cobranca.pedido.status },
        valoresDepois: { status: "AGUARDANDO_RETIRADA", origem: "conciliacao", gatewayId: cobranca.gatewayId },
      });
    }

    return prisma.cobrancaPagamento.findUnique({ where: { id } });
  }
}

function normalizarStatus(status: string): string {
  if (status === "approved") return "PAGO";
  if (["pending", "in_process", "authorized"].includes(status)) return "PENDENTE";
  if (["rejected", "cancelled"].includes(status)) return "RECUSADO";
  if (["refunded", "charged_back"].includes(status)) return "ESTORNADO";
  return status.toUpperCase();
}
