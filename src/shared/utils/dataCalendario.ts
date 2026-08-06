// Datas "de calendário" — vencimento, data da aula, nascimento — não são
// instantes: são um dia, sem hora. A convenção do sistema é guardá-las
// ancoradas na meia-noite UTC do dia em questão (é o que
// `new Date("2026-08-01")` produz) e SEMPRE lê-las pelos campos UTC.
//
// Ler uma dessas datas com os métodos locais (`getDate`, `getDay`,
// `setHours`, ou `toLocaleDateString` sem `timeZone`) devolve o dia
// anterior em qualquer fuso a oeste de Greenwich — o Brasil inteiro.
// Como o CI roda em UTC, esse erro passa despercebido até alguém rodar
// no fuso de Brasília: foi assim que a data do contrato saiu um dia
// antes e a replicação de aulas perdeu a última semana do período.
//
// Estes helpers existem pra que ninguém precise lembrar do
// `timeZone: "UTC"` na mão — esquecê-lo já aconteceu 3 vezes em 7 usos.

/** Formata uma data de calendário como dd/mm/aaaa, imune ao fuso do processo. */
export function formatarDataBR(data: Date): string {
  return data.toLocaleDateString("pt-BR", { timeZone: "UTC" });
}

/** Meia-noite UTC do dia de `data` — a forma canônica de guardar um dia. */
export function inicioDoDiaUTC(data: Date): Date {
  return new Date(
    Date.UTC(data.getUTCFullYear(), data.getUTCMonth(), data.getUTCDate(), 0, 0, 0, 0)
  );
}

/** Último instante do dia de `data`, em UTC — para limites de intervalo. */
export function fimDoDiaUTC(data: Date): Date {
  return new Date(
    Date.UTC(data.getUTCFullYear(), data.getUTCMonth(), data.getUTCDate(), 23, 59, 59, 999)
  );
}

/**
 * Dia da semana (0 = domingo) da data de calendário, lido em UTC.
 * Equivale ao `getDay()` correto para este tipo de valor.
 */
export function diaDaSemanaUTC(data: Date): number {
  return data.getUTCDay();
}

/** Avança `dias` no calendário sem sair do ancoramento UTC. */
export function somarDiasUTC(data: Date, dias: number): Date {
  const resultado = new Date(data.getTime());
  resultado.setUTCDate(resultado.getUTCDate() + dias);
  return resultado;
}

/** Fixa o horário do dia (hora local da academia) preservando o dia UTC. */
export function comHorarioUTC(data: Date, horas: number, minutos: number): Date {
  const resultado = new Date(data.getTime());
  resultado.setUTCHours(horas, minutos, 0, 0);
  return resultado;
}
