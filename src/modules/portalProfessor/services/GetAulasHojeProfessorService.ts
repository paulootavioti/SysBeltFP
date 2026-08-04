import { prisma } from "../../../shared/database/prisma";
import { intervaloHojeBrasilia, horarioBrasiliaHojeParaInstante } from "../utils/hoje";

interface Solicitante {
  id: number;
  perfil: string;
  unidadeId: number | null;
}

type StatusItemHoje = "AGENDADA" | "EM_ANDAMENTO" | "CONCLUIDA";

export class GetAulasHojeProfessorService {
  async execute(solicitante: Solicitante, referencia: Date = new Date()) {
    const { inicio, fim } = intervaloHojeBrasilia(referencia);

    const programadasHoje = await prisma.aulaProgramada.findMany({
      where: {
        data: { gte: inicio, lte: fim },
        status: { not: "CANCELADA" },
        turma: { professorId: solicitante.id },
      },
      include: {
        turma: { include: { _count: { select: { alunos: { where: { ativo: true } } } } } },
        aulaCurriculo: { include: { modulo: true, tecnicas: true } },
        aula: true,
      },
    });

    const itens = programadasHoje
      .map((programada) => {
        const jaFinalizada = programada.aula?.status === "FINALIZADA";
        const jaIniciada = programada.status === "INICIADA" && !jaFinalizada;
        const status: StatusItemHoje = jaFinalizada ? "CONCLUIDA" : jaIniciada ? "EM_ANDAMENTO" : "AGENDADA";

        const inicioAula = horarioBrasiliaHojeParaInstante(programada.turma.horarioInicio, referencia);
        const minutosParaComeco = Math.round((inicioAula.getTime() - referencia.getTime()) / 60000);

        return {
          aulaProgramadaId: programada.id,
          aulaId: programada.aulaId,
          turmaId: programada.turmaId,
          turmaNome: programada.turma.nome,
          horarioInicio: programada.turma.horarioInicio,
          horarioFim: programada.turma.horarioFim,
          totalAlunos: programada.turma._count.alunos,
          minutosParaComeco,
          plano: programada.aulaCurriculo
            ? {
                moduloNome: programada.aulaCurriculo.modulo.nome,
                tituloAula: programada.aulaCurriculo.titulo,
                totalTecnicas: programada.aulaCurriculo.tecnicas.length,
              }
            : null,
          status,
        };
      })
      .sort((a, b) => a.horarioInicio.localeCompare(b.horarioInicio));

    const emAndamento = itens.find((item) => item.status === "EM_ANDAMENTO");
    const proximaAgendada = itens.find((item) => item.status === "AGENDADA");
    const proximaAula = emAndamento ?? proximaAgendada ?? null;

    const outrasHoje = itens.filter((item) => item !== proximaAula);

    let proximaSemana = null;
    if (!proximaAula) {
      const proximaProgramada = await prisma.aulaProgramada.findFirst({
        where: {
          data: { gt: fim },
          status: "PENDENTE",
          turma: { professorId: solicitante.id },
        },
        include: { turma: true },
        orderBy: { data: "asc" },
      });

      if (proximaProgramada) {
        proximaSemana = {
          aulaProgramadaId: proximaProgramada.id,
          turmaId: proximaProgramada.turmaId,
          turmaNome: proximaProgramada.turma.nome,
          data: proximaProgramada.data,
          horarioInicio: proximaProgramada.turma.horarioInicio,
          horarioFim: proximaProgramada.turma.horarioFim,
        };
      }
    }

    return { proximaAula, outrasHoje, proximaSemana };
  }
}
