import { prisma } from "../database/prisma";

export interface ConflitoHorario {
  tipo: "SALA" | "PROFESSOR";
  turmaId: number;
  turmaNome: string;
}

function horariosSobrepoem(inicioA: string, fimA: string, inicioB: string, fimB: string): boolean {
  return inicioA < fimB && inicioB < fimA;
}

interface ConflitoTurmaParams {
  unidadeId: number;
  diasSemana: number[];
  horarioInicio: string;
  horarioFim: string;
  salaId?: number | null;
  professorId?: number | null;
  excluirTurmaId?: number;
}

// checagem para o padrão semanal recorrente de uma turma (usada ao criar/editar a Turma).
export async function buscarConflitoTurma(params: ConflitoTurmaParams): Promise<ConflitoHorario | null> {
  const { unidadeId, diasSemana, horarioInicio, horarioFim, salaId, professorId, excluirTurmaId } = params;

  if (!salaId && !professorId) return null;

  const candidatas = await prisma.turma.findMany({
    where: {
      unidadeId,
      ativo: true,
      id: excluirTurmaId ? { not: excluirTurmaId } : undefined,
      diasSemana: { hasSome: diasSemana },
      OR: [
        ...(salaId ? [{ salaId }] : []),
        ...(professorId ? [{ professorId }] : []),
      ],
    },
    select: { id: true, nome: true, salaId: true, professorId: true, horarioInicio: true, horarioFim: true },
  });

  for (const candidata of candidatas) {
    if (!horariosSobrepoem(horarioInicio, horarioFim, candidata.horarioInicio, candidata.horarioFim)) continue;

    if (salaId && candidata.salaId === salaId) {
      return { tipo: "SALA", turmaId: candidata.id, turmaNome: candidata.nome };
    }
    if (professorId && candidata.professorId === professorId) {
      return { tipo: "PROFESSOR", turmaId: candidata.id, turmaNome: candidata.nome };
    }
  }

  return null;
}

interface ConflitoProgramacaoParams {
  unidadeId: number;
  turmaId: number;
  salaId?: number | null;
  professorId?: number | null;
  horarioInicio: string;
  horarioFim: string;
  datas: Date[];
}

export interface ConflitoProgramacao extends ConflitoHorario {
  data: Date;
}

// checagem por data concreta (usada ao programar/replicar aulas) — como o horário é fixo
// por turma, basta achar as turmas cujo horário colide e checar se elas já têm programação
// (não cancelada) em alguma das datas alvo.
export async function buscarConflitoProgramacao(
  params: ConflitoProgramacaoParams
): Promise<ConflitoProgramacao | null> {
  const { unidadeId, turmaId, salaId, professorId, horarioInicio, horarioFim, datas } = params;

  if (!salaId && !professorId) return null;
  if (datas.length === 0) return null;

  const turmasCandidatas = await prisma.turma.findMany({
    where: {
      unidadeId,
      id: { not: turmaId },
      OR: [
        ...(salaId ? [{ salaId }] : []),
        ...(professorId ? [{ professorId }] : []),
      ],
    },
    select: { id: true, salaId: true, professorId: true, horarioInicio: true, horarioFim: true },
  });

  const idsConflitantes = turmasCandidatas
    .filter((candidata) => horariosSobrepoem(horarioInicio, horarioFim, candidata.horarioInicio, candidata.horarioFim))
    .map((candidata) => candidata.id);

  if (idsConflitantes.length === 0) return null;

  const programacaoConflitante = await prisma.aulaProgramada.findFirst({
    where: {
      turmaId: { in: idsConflitantes },
      status: { not: "CANCELADA" },
      data: { in: datas },
    },
    include: { turma: { select: { id: true, nome: true, salaId: true, professorId: true } } },
    orderBy: { data: "asc" },
  });

  if (!programacaoConflitante) return null;

  const tipo: "SALA" | "PROFESSOR" =
    salaId && programacaoConflitante.turma.salaId === salaId ? "SALA" : "PROFESSOR";

  return {
    tipo,
    turmaId: programacaoConflitante.turma.id,
    turmaNome: programacaoConflitante.turma.nome,
    data: programacaoConflitante.data,
  };
}

function descricaoRecurso(tipo: "SALA" | "PROFESSOR"): { sujeito: string; ocupado: string } {
  return tipo === "SALA"
    ? { sujeito: "A sala", ocupado: "ocupada" }
    : { sujeito: "O professor", ocupado: "ocupado" };
}

export function mensagemConflitoTurma(conflito: ConflitoHorario): string {
  const { sujeito, ocupado } = descricaoRecurso(conflito.tipo);

  return `Conflito de horário: ${sujeito.toLowerCase()} já está ${ocupado} pela turma "${conflito.turmaNome}" nesse dia e horário.`;
}

export function mensagemConflitoProgramacao(conflito: ConflitoProgramacao): string {
  const { sujeito, ocupado } = descricaoRecurso(conflito.tipo);
  const dataFormatada = conflito.data.toLocaleDateString("pt-BR", { timeZone: "UTC" });

  return `Conflito de horário em ${dataFormatada}: ${sujeito.toLowerCase()} já está ${ocupado} pela turma "${conflito.turmaNome}".`;
}
