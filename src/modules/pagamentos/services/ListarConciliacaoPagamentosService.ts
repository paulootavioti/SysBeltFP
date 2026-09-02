import { prismaDaRequisicao } from "../../../shared/database/prismaDaRequisicao";
import { escopoUnidade } from "../../../shared/utils/escopoUnidade";

export class ListarConciliacaoPagamentosService {
  async execute(unidadeId: number | null, status?: string) {
    const prisma = prismaDaRequisicao();

    return prisma.cobrancaPagamento.findMany({
      where: {
        ...escopoUnidade(unidadeId),
        ...(status ? { status } : {}),
      },
      include: {
        mensalidade: {
          select: {
            id: true,
            valorFinal: true,
            valor: true,
            vencimento: true,
            status: true,
            aluno: { select: { id: true, nome: true } },
          },
        },
        pedido: {
          select: {
            id: true,
            total: true,
            status: true,
            aluno: { select: { id: true, nome: true } },
          },
        },
        formaPagamento: { select: { id: true, tipo: true, nomePersonalizado: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 200,
    });
  }
}
