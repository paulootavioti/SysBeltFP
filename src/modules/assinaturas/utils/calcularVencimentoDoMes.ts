// Resolve o dia de vencimento configurado (1-31) pro mês de referência,
// prendendo ao último dia real do mês quando ele tiver menos dias (ex.:
// diaVencimento=31 em fevereiro vira o último dia de fevereiro).
export function calcularVencimentoDoMes(diaVencimento: number, referencia: Date = new Date()): Date {
  const ano = referencia.getFullYear();
  const mes = referencia.getMonth();
  const ultimoDiaDoMes = new Date(ano, mes + 1, 0).getDate();
  const dia = Math.min(diaVencimento, ultimoDiaDoMes);

  return new Date(ano, mes, dia);
}
