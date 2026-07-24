import { prisma } from "../../../shared/database/prisma";
import { calcularSemana } from "../utils/semana";

type StatusExibicao = "AGENDADA" | "CONCLUIDA" | "NAO_REALIZADA";

function calcularStatusExibicao(
  statusProgramacao: string,
  data: Date,
  horarioInicio: string
): StatusExibicao {
  // uma vez iniciada (mesmo que a chamada ainda esteja em aberto), a
  // programação deixa de ser uma pendência — não faz sentido oferecer
  // "Iniciar Aula" de novo pra ela.
  if (statusProgramacao === "INICIADA") {
    return "CONCLUIDA";
  }

  // cancelada também não vai mais acontecer, mesmo bucket visual de
  // "não realizada".
  if (statusProgramacao === "CANCELADA") {
    return "NAO_REALIZADA";
  }

  const [horas, minutos] = horarioInicio.split(":").map(Number);

  const horarioDaAula = new Date(data);
  horarioDaAula.setHours(horas || 0, minutos || 0, 0, 0);

  if (horarioDaAula.getTime() < Date.now()) {
    return "NAO_REALIZADA";
  }

  return "AGENDADA";
}

export class GetGradeSemanalService {
  async execute(referencia: Date = new Date()) {
    const { inicio, fim } = calcularSemana(referencia);

    const programadas = await prisma.aulaProgramada.findMany({
      where: {
        data: { gte: inicio, lte: fim },
      },
      include: {
        turma: {
          include: {
            professor: true,
          },
        },
      },
      orderBy: { data: "asc" },
    });

    return programadas.map((programada) => ({
      id: programada.id,
      turmaId: programada.turmaId,
      turmaNome: programada.turma.nome,
      professorApelido:
        programada.turma.professor?.apelido || programada.turma.professor?.nome || null,
      data: programada.data,
      diaSemana: programada.data.getDay(),
      horarioInicio: programada.turma.horarioInicio,
      horarioFim: programada.turma.horarioFim,
      status: calcularStatusExibicao(
        programada.status,
        programada.data,
        programada.turma.horarioInicio
      ),
    }));
  }
}
