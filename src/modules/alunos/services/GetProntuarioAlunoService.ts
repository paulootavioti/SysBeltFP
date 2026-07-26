import { prisma } from "../../../shared/database/prisma";
import { AppError } from "../../../shared/errors/AppError";
import { garantirAcessoUnidade } from "../../../shared/utils/escopoUnidade";

export class GetProntuarioAlunoService {
  async execute(id: number, unidadeId: number | null) {
    const aluno = await prisma.aluno.findUnique({
      where: {
        id,
      },
      include: {
        turma: true,

        responsaveis: {
          orderBy: {
            nome: "asc",
          },
        },

        mensalidades: {
          orderBy: {
            vencimento: "desc",
          },
        },

        graduacoes: {
          orderBy: {
            data: "desc",
          },
        },

        competicoes: {
          include: {
            competicao: true,
          },
        },

        aulas: {
          include: {
            aula: {
              include: {
                turma: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });

    if (!aluno) {
      throw new AppError("Aluno não encontrado.");
    }

    garantirAcessoUnidade(unidadeId, aluno.unidadeId, "Aluno não encontrado.");

    const totalAulas = aluno.aulas.length;

    const totalPresencas = aluno.aulas.filter(
      (registro) => registro.presente
    ).length;

    const comportamento = {
      respeito: aluno.aulas.filter((aula) => aula.respeito).length,
      valentia: aluno.aulas.filter((aula) => aula.valentia).length,
      esforco: aluno.aulas.filter((aula) => aula.esforco).length,
      atencao: aluno.aulas.filter((aula) => aula.atencao).length,
      disciplina: aluno.aulas.filter((aula) => aula.disciplina).length,
    };

    const proximoGrauEm =
      totalPresencas === 0 ? 8 : 8 - (totalPresencas % 8);

    return {
      aluno,
      resumo: {
        totalAulas,
        totalPresencas,
        frequencia:
          totalAulas > 0
            ? Math.round((totalPresencas / totalAulas) * 100)
            : 0,

        faixa: aluno.faixa,
        grau: aluno.grau,
        proximoGrauEm:
          proximoGrauEm === 8 ? 8 : proximoGrauEm,
      },
      comportamento,
      responsaveis: aluno.responsaveis,
      turma: aluno.turma,
      historicoAulas: aluno.aulas,
      mensalidades: aluno.mensalidades,
      graduacoes: aluno.graduacoes,
      competicoes: aluno.competicoes,
    };
  }
}