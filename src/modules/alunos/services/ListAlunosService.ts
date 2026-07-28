import { prisma } from "../../../shared/database/prisma";
import { LIMITE_PADRAO_LISTAGEM } from "../../../shared/constants/pagination";
import { escopoUnidade } from "../../../shared/utils/escopoUnidade";

export class ListAlunosService {

  async execute(unidadeId: number | null, perfil?: string) {

    // PROFESSOR só pode VER: nome, apelido, nome do responsável e turma —
    // nada de CPF, endereço, saúde ou financeiro do aluno. `ativo` e
    // `dataNascimento` também vêm, mas só de apoio interno (filtrar alunos
    // ativos, calcular a trilha de faixa ao registrar graduação) — nenhuma
    // tela do Professor exibe esses dois campos.
    if (perfil === "PROFESSOR") {
      return prisma.aluno.findMany({
        where: escopoUnidade(unidadeId),
        take: LIMITE_PADRAO_LISTAGEM,
        orderBy: { nome: "asc" },
        select: {
          id: true,
          nome: true,
          apelido: true,
          ativo: true,
          dataNascimento: true,
          turma: { select: { id: true, nome: true } },
          responsaveis: { select: { id: true, nome: true } },
        },
      });
    }

    const alunos =
      await prisma.aluno.findMany({
        where: escopoUnidade(unidadeId),
        take: LIMITE_PADRAO_LISTAGEM,
        orderBy: {
          nome: "asc"
        },
        include: {
          mensalidades: {
            orderBy: {
              vencimento: "desc"
            }
          }
        }
      });

    return alunos;
  }
}