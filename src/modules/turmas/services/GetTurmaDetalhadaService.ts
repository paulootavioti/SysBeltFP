import { prisma } from "../../../shared/database/prisma";
import { AppError } from "../../../shared/errors/AppError";
import { garantirAcessoUnidade } from "../../../shared/utils/escopoUnidade";
import { calcularFrequenciaPorPeriodo } from "../../../shared/utils/calcularFrequencia";

export class GetTurmaDetalhadaService {
  async execute(id: number, unidadeId: number | null) {
    const turma = await prisma.turma.findUnique({
      where: {
        id,
      },
      include: {
        curriculo: true,
        professor: {
          select: {
            id: true,
            nome: true,
            apelido: true,
          },
        },
        arena: true,
        modalidade: true,
        alunos: {
          orderBy: {
            nome: "asc",
          },
          include: {
            aulas: {
              select: { presente: true, aula: { select: { data: true } } },
            },
          },
        },
      },
    });

    if (!turma) {
      throw new AppError("Turma não encontrada.");
    }

    garantirAcessoUnidade(unidadeId, turma.unidadeId, "Turma não encontrada.");

    const anoAtual = new Date().getFullYear();

    const alunos = turma.alunos.map(({ aulas, ...aluno }) => ({
      ...aluno,
      temAulaNoAno: aulas.some((registro) => new Date(registro.aula.data).getFullYear() === anoAtual),
      ...calcularFrequenciaPorPeriodo(
        aulas.map((registro) => ({ presente: registro.presente, data: registro.aula.data }))
      ),
    }));

    // frequência média da turma no ano corrente — só entre alunos que já
    // tiveram alguma aula registrada nesse ano, pra não diluir a média
    // com quem acabou de entrar e ainda não teve nenhuma chamada (esses
    // têm frequenciaAno 0 só por falta de dado, não por falta).
    const alunosComHistorico = alunos.filter((aluno) => aluno.temAulaNoAno);
    const frequenciaMediaAno = alunosComHistorico.length > 0
      ? Math.round(
          alunosComHistorico.reduce((soma, aluno) => soma + aluno.frequenciaAno, 0) / alunosComHistorico.length
        )
      : 0;

    return {
      ...turma,
      alunos: alunos.map(({ temAulaNoAno: _temAulaNoAno, ...aluno }) => aluno),
      frequenciaMediaAno,
    };
  }
}