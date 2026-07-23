export function calcularSemana(referencia: Date) {
  const diaDaSemana = referencia.getDay();
  const diffParaSegunda = diaDaSemana === 0 ? -6 : 1 - diaDaSemana;

  const inicio = new Date(referencia);
  inicio.setHours(0, 0, 0, 0);
  inicio.setDate(inicio.getDate() + diffParaSegunda);

  const fim = new Date(inicio);
  fim.setDate(inicio.getDate() + 6);
  fim.setHours(23, 59, 59, 999);

  return { inicio, fim };
}
