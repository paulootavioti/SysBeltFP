import { prisma } from "../../../shared/database/prisma";

export class ListPedidosFamiliaService {
  async execute(alunoId: number) {
    return prisma.pedido.findMany({
      where: { alunoId },
      include: { itens: { include: { variante: { include: { produto: true } } } } },
      orderBy: { criadoEm: "desc" },
    });
  }
}
