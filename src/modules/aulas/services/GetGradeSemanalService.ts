import { prisma } from "../../../shared/database/prisma";
import { calcularSemana } from "../utils/semana";

type StatusExibicao = "AGENDADA" | "CONCLUIDA" | "NAO_REALIZADA";

// Brasília não tem mais horário de verão desde 2019, então o offset é fixo.
const BRASIL_UTC_OFFSET_HORAS = 3;

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

  // `data` guarda a meia-noite UTC do dia pretendido e horarioInicio é
  // sempre horário local de Brasília. setHours()/getHours() operam no fuso
  // do processo Node (UTC no Netlify), não no de Brasília — usá-los aqui
  // fazia aulas à noite serem dadas como "NAO_REALIZADA" até 3h antes de
  // realmente começarem. Por isso o cálculo é feito manualmente em UTC.
  const horarioDaAula = new Date(
    Date.UTC(
      data.getUTCFullYear(),
      data.getUTCMonth(),
      data.getUTCDate(),
      (horas || 0) + BRASIL_UTC_OFFSET_HORAS,
      minutos || 0,
      0,
      0
    )
  );

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
      diaSemana: programada.data.getUTCDay(),
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
