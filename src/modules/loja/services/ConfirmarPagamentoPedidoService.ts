import { prismaDaRequisicao } from "../../../shared/database/prismaDaRequisicao";
import { AppError } from "../../../shared/errors/AppError";
import { AuditLogService } from "../../../shared/services/AuditLogService";
import { garantirAcessoUnidade } from "../../../shared/utils/escopoUnidade";

export class ConfirmarPagamentoPedidoService {
  async execute(id: number, origemSistema?: string, unidadeId: number | null = null) {
    const prisma = prismaDaRequisicao();
    const pedido = await prisma.pedido.findUnique({ where: { id } });
    if (!pedido) throw new AppError("Pedido não encontrado.");
    garantirAcessoUnidade(unidadeId, pedido.unidadeId, "Pedido não encontrado.");
    if (["AGUARDANDO_RETIRADA", "ENTREGUE"].includes(pedido.status)) return pedido;
    if (pedido.status !== "AGUARDANDO_PAGAMENTO") throw new AppError("Este pedido não pode receber confirmação de pagamento.");
    const atualizado = await prisma.pedido.update({ where: { id }, data: { status: "AGUARDANDO_RETIRADA", pagoEm: new Date() } });
    await new AuditLogService().registrar({
      unidadeId: pedido.unidadeId, origemSistema, entidade: "Pedido", entidadeId: id, operacao: "PAGAMENTO",
      valoresAntes: { status: pedido.status }, valoresDepois: { status: atualizado.status },
    });
    return atualizado;
  }
}
