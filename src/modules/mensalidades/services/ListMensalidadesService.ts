import { prismaDaRequisicao } from "../../../shared/database/prismaDaRequisicao";
import { LIMITE_PADRAO_LISTAGEM } from "../../../shared/constants/pagination";
import { escopoUnidade } from "../../../shared/utils/escopoUnidade";

export class ListMensalidadesService {

  async execute(unidadeId: number | null) {
    const prisma = prismaDaRequisicao();

    const mensalidades =
      await prisma.mensalidade.findMany({
        where: escopoUnidade(unidadeId),
        take: LIMITE_PADRAO_LISTAGEM,
        orderBy: { vencimento: "desc" },
        include: {
          aluno: {
            include: {
              turma: { select: { nome: true } },
              graduacoes: { where: { status: "aprovada" }, orderBy: { data: "desc" }, take: 1, select: { cor: true } },
            },
          },
          formaPagamento: true,
        }
      });

    return mensalidades.map(({ aluno, ...mensalidade }) => {
      const { graduacoes, turma, ...dadosAluno } = aluno;
      return { ...mensalidade, aluno: { ...dadosAluno, turmaNome: turma?.nome ?? null, faixaCor: graduacoes[0]?.cor ?? null } };
    });
  }

}
