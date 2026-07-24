const DIAS_SEMANA_EXTENSO = [
  "domingo",
  "segunda-feira",
  "terça-feira",
  "quarta-feira",
  "quinta-feira",
  "sexta-feira",
  "sábado",
];

export function formatarDiasSemana(dias: number[]): string {
  const nomes = [...dias].sort((a, b) => a - b).map((dia) => DIAS_SEMANA_EXTENSO[dia]);

  if (nomes.length === 0) return "";
  if (nomes.length === 1) return nomes[0];

  return `${nomes.slice(0, -1).join(", ")} e ${nomes[nomes.length - 1]}`;
}
