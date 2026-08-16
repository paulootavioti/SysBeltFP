import { prismaDaRequisicao } from "../../../shared/database/prismaDaRequisicao";
import { calcularSemana } from "../utils/semana";
import { escopoUnidade } from "../../../shared/utils/escopoUnidade";

type StatusExibicao = "AGENDADA" | "CONCLUIDA" | "NAO_REALIZADA";

// Brasília não tem mais horário de verão desde 2019, então o offset é fixo.
const BRASIL_UTC_OFFSET_MS = 3 * 60 * 60 * 1000;

// meia-noite (UTC, só como referência numérica) do dia em Brasília em que
// `instante` cai — subtrair o offset antes de ler os campos UTC é o jeito
// de converter um instante absoluto pro "dia calendário" de um fuso fixo
// sem depender do fuso do processo Node.
function diaEmBrasilia(instante: Date): number {
  const local = new Date(instante.getTime() - BRASIL_UTC_OFFSET_MS);
  return Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate());
}

function calcularStatusExibicao(
  statusProgramacao: string,
  data: Date,
  referencia: Date
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

  // uma pendência só vira "não realizada" quando o DIA dela já passou por
  // completo — não quando só o horário de hoje já passou. Isso permite
  // iniciar uma aula atrasada (ex.: chamada esquecida às 17h30, iniciada
  // às 19h) em vez dela sumir de "Aulas de Hoje" assim que bate o horário.
  const diaDaAula = Date.UTC(data.getUTCFullYear(), data.getUTCMonth(), data.getUTCDate());

  if (diaDaAula < diaEmBrasilia(referencia)) {
    return "NAO_REALIZADA";
  }

  return "AGENDADA";
}

export class GetGradeSemanalService {
  async execute(unidadeId: number | null, referencia: Date = new Date()) {
    const prisma = prismaDaRequisicao();
    const { inicio, fim } = calcularSemana(referencia);

    const programadas = await prisma.aulaProgramada.findMany({
      where: {
        data: { gte: inicio, lte: fim },
        ...escopoUnidade(unidadeId),
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
      professorId: programada.turma.professorId,
      professorApelido:
        programada.turma.professor?.apelido || programada.turma.professor?.nome || null,
      data: programada.data,
      diaSemana: programada.data.getUTCDay(),
      horarioInicio: programada.turma.horarioInicio,
      horarioFim: programada.turma.horarioFim,
      // id da Aula já criada (só existe depois de "Iniciar Aula") — deixa o
      // front linkar direto pra chamada em andamento sem precisar chamar
      // iniciar de novo.
      aulaId: programada.aulaId,
      status: calcularStatusExibicao(programada.status, programada.data, referencia),
    }));
  }
}
