// Competência e vencimento da fatura da plataforma.
//
// Ambos são DATA DE CALENDÁRIO, não instante: "a fatura de agosto vence
// dia 10" não muda de significado conforme o fuso de quem olha. Seguem a
// convenção de src/shared/utils/dataCalendario.ts — meia-noite UTC, lidos
// e escritos sempre com acessores UTC. Usar getMonth()/new Date(a, m, d)
// aqui faria a competência virar julho pra quem está em Brasília no dia 1º.

/** Dia 1º do mês da data informada, à meia-noite UTC. */
export function competenciaDoMes(referencia: Date = new Date()): Date {
  return new Date(Date.UTC(referencia.getUTCFullYear(), referencia.getUTCMonth(), 1, 0, 0, 0, 0));
}

/**
 * Resolve o dia de vencimento (1-31) dentro da competência, prendendo ao
 * último dia real do mês quando ele for mais curto — dia 31 em fevereiro
 * vence no dia 28 (ou 29), não escorrega pra março.
 */
export function vencimentoDaCompetencia(competencia: Date, diaVencimento: number): Date {
  const ano = competencia.getUTCFullYear();
  const mes = competencia.getUTCMonth();

  // dia 0 do mês seguinte é o último dia deste mês.
  const ultimoDia = new Date(Date.UTC(ano, mes + 1, 0)).getUTCDate();
  const dia = Math.min(Math.max(diaVencimento, 1), ultimoDia);

  return new Date(Date.UTC(ano, mes, dia, 0, 0, 0, 0));
}

/** "agosto de 2026" — pra exibir em tela e em e-mail de cobrança. */
export function formatarCompetencia(competencia: Date): string {
  return competencia.toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}
