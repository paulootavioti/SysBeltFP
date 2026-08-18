import { prismaDaRequisicao } from "../../../shared/database/prismaDaRequisicao";
import { LIMITE_PADRAO_LISTAGEM } from "../../../shared/constants/pagination";
import { escopoUnidade } from "../../../shared/utils/escopoUnidade";

export class ListAlunosService {

  async execute(unidadeId: number | null, perfil?: string) {
    const prisma = prismaDaRequisicao();

    // O aluno pode estar autorizado em mais de uma unidade (AlunoUnidade),
    // então o escopo entra pela junção. Sem alcance no `where` (rotina
    // interna) a listagem continua sendo do tenant inteiro.
    const alcance = escopoUnidade(unidadeId);
    const escopoAluno =
      alcance.unidadeId === undefined ? {} : { unidadesPermitidas: { some: alcance } };

    // PROFESSOR só pode VER: nome, apelido, nome do responsável e turma —
    // nada de CPF, endereço, saúde ou financeiro do aluno. `ativo` e
    // `dataNascimento` também vêm, mas só de apoio interno (filtrar alunos
    // ativos, calcular a trilha de faixa ao registrar graduação) — nenhuma
    // tela do Professor exibe esses dois campos.
    if (perfil === "PROFESSOR") {
      return prisma.aluno.findMany({
        where: escopoAluno,
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
        where: escopoAluno,
        take: LIMITE_PADRAO_LISTAGEM,
        orderBy: {
          nome: "asc"
        },
        include: {
          unidadesPermitidas: { select: { unidadeId: true } },
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
