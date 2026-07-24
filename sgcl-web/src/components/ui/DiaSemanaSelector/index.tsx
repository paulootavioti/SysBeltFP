import { DIAS_SEMANA } from "../../../shared/constants/diasSemana";

import "./styles.css";

interface DiaSemanaSelectorProps {
  label?: string;
  value: number[];
  onChange: (dias: number[]) => void;
}

export function DiaSemanaSelector({
  label = "Dias da semana",
  value,
  onChange,
}: DiaSemanaSelectorProps) {
  function alternarDia(indice: number) {
    const novo = value.includes(indice)
      ? value.filter((d) => d !== indice)
      : [...value, indice];
    onChange(novo);
  }

  return (
    <div className="dia-semana-selector">
      {label && <label className="dia-semana-selector-label">{label}</label>}
      <div className="dia-semana-selector-dias">
        {DIAS_SEMANA.map((dia) => (
          <button
            key={dia.indice}
            type="button"
            className={
              value.includes(dia.indice)
                ? "dia-semana-selector-dia active"
                : "dia-semana-selector-dia"
            }
            onClick={() => alternarDia(dia.indice)}
          >
            {dia.label}
          </button>
        ))}
      </div>
    </div>
  );
}
