const DIAS_SEMANA = [
  { indice: 1, label: "Seg" },
  { indice: 2, label: "Ter" },
  { indice: 3, label: "Qua" },
  { indice: 4, label: "Qui" },
  { indice: 5, label: "Sex" },
  { indice: 6, label: "Sáb" },
  { indice: 0, label: "Dom" },
];

export function formatarDiasSemana(dias: number[]): string {
  const ordem = DIAS_SEMANA.map((dia) => dia.indice);
  const labelPorIndice = new Map(DIAS_SEMANA.map((dia) => [dia.indice, dia.label]));

  return [...dias]
    .sort((a, b) => ordem.indexOf(a) - ordem.indexOf(b))
    .map((indice) => labelPorIndice.get(indice))
    .filter(Boolean)
    .join(", ");
}
