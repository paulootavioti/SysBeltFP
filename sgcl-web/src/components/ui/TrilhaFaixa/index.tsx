import { CORES_FAIXA } from "../../../modules/graduacoes/types";

import "./styles.css";

interface TrilhaFaixaProps {
  faixa?: string | null;
  size?: number;
  comLabel?: boolean;
  title?: string;
  className?: string;
}

// círculo colorido pela paleta de faixas (mesma usada no Planejamento
// Pedagógico) — reaproveitado em qualquer lugar que mostre a faixa de um
// aluno: Alunos > Listar/Detalhes, Turmas > Detalhes, Currículo.
export function TrilhaFaixa({ faixa, size = 14, comLabel = false, title, className }: TrilhaFaixaProps) {
  if (!faixa) return null;

  const cor = CORES_FAIXA[faixa];

  return (
    <span className={`trilha-faixa${className ? ` ${className}` : ""}`}>
      <span
        className="trilha-faixa-swatch"
        title={title ?? faixa}
        style={{
          width: size,
          height: size,
          background: cor?.background ?? "#9CA3AF",
          border: !cor || faixa === "Branca" ? "1px solid var(--border)" : undefined,
        }}
      />
      {comLabel && <span className="trilha-faixa-label">{faixa}</span>}
    </span>
  );
}
