import { prismaDaRequisicao } from "../../../shared/database/prismaDaRequisicao";

export class ListPedidosFamiliaService {
  async execute(alunoId: number) {
    const prisma = prismaDaRequisicao();
    return prisma.pedido.findMany({
      where: { alunoId },
      include: {
        itens: { include: { variante: { include: { produto: true } } } },
        formaPagamento: { select: { id: true, tipo: true, nomePersonalizado: true } },
        cobrancas: { orderBy: { createdAt: "desc" }, take: 1 },
      },
      orderBy: { criadoEm: "desc" },
    });
  }
}
