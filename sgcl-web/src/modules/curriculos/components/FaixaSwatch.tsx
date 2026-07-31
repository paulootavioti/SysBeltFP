import { CORES_FAIXA } from "../../graduacoes/types";

interface FaixaSwatchProps {
  faixa?: string | null;
  size?: number;
  title?: string;
}

export function FaixaSwatch({ faixa, size = 14, title }: FaixaSwatchProps) {
  if (!faixa) return null;

  const cor = CORES_FAIXA[faixa];

  return (
    <span
      className="faixa-swatch"
      title={title ?? faixa}
      style={{
        width: size,
        height: size,
        background: cor?.background ?? "#9CA3AF",
        border: !cor || faixa === "Branca" ? "1px solid var(--border)" : undefined,
      }}
    />
  );
}
