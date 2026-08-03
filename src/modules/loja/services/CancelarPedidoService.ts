import { prisma } from "../../../shared/database/prisma";
import { AppError } from "../../../shared/errors/AppError";
import { garantirAcessoUnidade } from "../../../shared/utils/escopoUnidade";

export class CancelarPedidoService {
  async execute(id: number, unidadeId: number | null) {
    const pedido = await prisma.pedido.findUnique({
      where: { id },
      include: { itens: true },
    });

    if (!pedido) {
      throw new AppError("Pedido não encontrado.");
    }

    garantirAcessoUnidade(unidadeId, pedido.unidadeId, "Pedido não encontrado.");

    if (pedido.status !== "AGUARDANDO_RETIRADA") {
      throw new AppError("Só é possível cancelar um pedido aguardando retirada.");
    }

    return prisma.$transaction(async (tx) => {
      for (const item of pedido.itens) {
        await tx.produtoVariante.update({
          where: { id: item.varianteId },
          data: { estoque: { increment: item.quantidade } },
        });

        await tx.movimentacaoEstoque.create({
          data: {
            varianteId: item.varianteId,
            tipo: "ENTRADA",
            quantidade: item.quantidade,
            motivo: `Cancelamento - Pedido #${pedido.id}`,
          },
        });
      }

      return tx.pedido.update({
        where: { id },
        data: { status: "CANCELADO" },
      });
    });
  }
}
