import { prismaDaRequisicao } from "../../../shared/database/prismaDaRequisicao";

export class ListPedidosFamiliaService {
  async execute(alunoId: number) {
    const prisma = prismaDaRequisicao();
    return prisma.pedido.findMany({
      where: { alunoId },
      include: { itens: { include: { variante: { include: { produto: true } } } } },
      orderBy: { criadoEm: "desc" },
    });
  }
}
