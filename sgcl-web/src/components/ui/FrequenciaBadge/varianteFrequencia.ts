export type VarianteFrequencia = "success" | "warning" | "danger";

// verde ≥80%, âmbar 60-79%, vermelho <60% — mesmo corte usado em
// qualquer lugar que precise sinalizar frequência de presença.
export function varianteFrequencia(percentual: number): VarianteFrequencia {
  if (percentual >= 80) return "success";
  if (percentual >= 60) return "warning";
  return "danger";
}
