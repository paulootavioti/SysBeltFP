import { prisma } from "../../../shared/database/prisma";
import { AppError } from "../../../shared/errors/AppError";
import { garantirAcessoUnidade } from "../../../shared/utils/escopoUnidade";
import { calcularFrequenciaPorPeriodo } from "../../../shared/utils/calcularFrequencia";

interface Solicitante {
  id: number;
  perfil: string;
  unidadeId: number | null;
}

export class GetProntuarioAlunoService {
  async execute(id: number, solicitante: Solicitante) {
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

    garantirAcessoUnidade(solicitante.unidadeId, aluno.unidadeId, "Aluno não encontrado.");

    // o professor só enxerga o prontuário de alunos das próprias turmas —
    // e um recorte pedagógico dele (sem dados financeiros/de contato), ao
    // contrário de ADMIN/RECEPCAO, que acessam a ficha completa.
    if (solicitante.perfil === "PROFESSOR" && aluno.turma?.professorId !== solicitante.id) {
      throw new AppError("Você só pode acessar o prontuário de alunos das suas próprias turmas.", 403);
    }

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

    const { frequenciaMes, frequenciaAno } = calcularFrequenciaPorPeriodo(
      aluno.aulas.map((registro) => ({ presente: registro.presente, data: registro.aula.data }))
    );

    // registros individuais de avaliação de comportamento (só os que têm
    // alguma marcação ou observação — não a lista inteira de chamadas).
    const comportamentoRegistros = aluno.aulas
      .filter(
        (registro) =>
          registro.respeito ||
          registro.valentia ||
          registro.esforco ||
          registro.atencao ||
          registro.disciplina ||
          registro.observacao
      )
      .map((registro) => ({
        id: registro.id,
        data: registro.aula.data,
        respeito: registro.respeito,
        valentia: registro.valentia,
        esforco: registro.esforco,
        atencao: registro.atencao,
        disciplina: registro.disciplina,
        observacao: registro.observacao,
      }));

    const resumo = {
      totalAulas,
      totalPresencas,
      frequencia:
        totalAulas > 0
          ? Math.round((totalPresencas / totalAulas) * 100)
          : 0,
      frequenciaMes,
      frequenciaAno,

      faixa: aluno.faixa,
      grau: aluno.grau,
      proximoGrauEm:
        proximoGrauEm === 8 ? 8 : proximoGrauEm,
    };

    if (solicitante.perfil === "PROFESSOR") {
      // recorte pedagógico: sem contato/endereço/kimono do aluno, sem
      // contato dos responsáveis e sem dados financeiros/de competições.
      return {
        aluno: {
          id: aluno.id,
          nome: aluno.nome,
          apelido: aluno.apelido,
          dataNascimento: aluno.dataNascimento,
          ativo: aluno.ativo,
        },
        resumo,
        comportamento,
        comportamentoRegistros,
        responsaveis: aluno.responsaveis.map((responsavel) => ({
          id: responsavel.id,
          nome: responsavel.nome,
          parentesco: responsavel.parentesco,
        })),
        turma: aluno.turma,
        graduacoes: aluno.graduacoes,
      };
    }

    return {
      aluno,
      resumo,
      comportamento,
      comportamentoRegistros,
      responsaveis: aluno.responsaveis,
      turma: aluno.turma,
      historicoAulas: aluno.aulas,
      mensalidades: aluno.mensalidades,
      graduacoes: aluno.graduacoes,
      competicoes: aluno.competicoes,
    };
  }
}