export type VarianteEstoque = "neutral" | "warning" | "danger";

// vermelho quando estoque = 0, âmbar quando ≤3, neutro acima disso.
export function varianteEstoque(estoque: number): VarianteEstoque {
  if (estoque === 0) return "danger";
  if (estoque <= 3) return "warning";
  return "neutral";
}
