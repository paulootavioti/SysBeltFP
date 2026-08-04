// Brasília não tem mais horário de verão desde 2019, então o offset é fixo
// (mesma convenção usada em GetGradeSemanalService, duplicada aqui porque
// não há um util de fuso horário compartilhado no shared/ ainda).
const BRASIL_UTC_OFFSET_MS = 3 * 60 * 60 * 1000;

// intervalo [meia-noite, 23:59:59.999] do dia calendário em Brasília em que
// `referencia` cai, nos mesmos termos em que AulaProgramada.data é gravada
// (um valor "YYYY-MM-DD" sem horário, interpretado pelos campos UTC).
export function intervaloHojeBrasilia(referencia: Date = new Date()) {
  const local = new Date(referencia.getTime() - BRASIL_UTC_OFFSET_MS);
  const inicio = new Date(Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate()));
  const fim = new Date(inicio.getTime() + 24 * 60 * 60 * 1000 - 1);

  return { inicio, fim };
}

// converte um horário "HH:MM" (relativo ao dia calendário em Brasília de
// `referencia`) num instante absoluto real, comparável a `referencia`
// independente do fuso horário do processo Node.
export function horarioBrasiliaHojeParaInstante(horario: string, referencia: Date = new Date()): Date {
  const [horas, minutos] = horario.split(":").map(Number);
  const local = new Date(referencia.getTime() - BRASIL_UTC_OFFSET_MS);
  const instanteLocal = Date.UTC(
    local.getUTCFullYear(),
    local.getUTCMonth(),
    local.getUTCDate(),
    horas || 0,
    minutos || 0
  );

  return new Date(instanteLocal + BRASIL_UTC_OFFSET_MS);
}
