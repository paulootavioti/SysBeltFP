import { prismaDaRequisicao } from "../../../shared/database/prismaDaRequisicao";
import { AppError } from "../../../shared/errors/AppError";
import { garantirAcessoUnidade } from "../../../shared/utils/escopoUnidade";

export class MarcarPedidoEntregueService {
  async execute(id: number, unidadeId: number | null) {
    const prisma = prismaDaRequisicao();
    const pedido = await prisma.pedido.findUnique({ where: { id } });

    if (!pedido) {
      throw new AppError("Pedido não encontrado.");
    }

    garantirAcessoUnidade(unidadeId, pedido.unidadeId, "Pedido não encontrado.");

    if (pedido.status !== "AGUARDANDO_RETIRADA") {
      throw new AppError("Só é possível marcar como entregue um pedido aguardando retirada.");
    }

    return prisma.pedido.update({
      where: { id },
      data: { status: "ENTREGUE", entregueEm: new Date() },
    });
  }
}
