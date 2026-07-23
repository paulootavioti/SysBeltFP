import type { PeriodoContagem } from "../../types";

import "./styles.css";

const OPCOES: { valor: PeriodoContagem; rotulo: string }[] = [
  { valor: "SEMANAL", rotulo: "Semanal" },
  { valor: "MENSAL", rotulo: "Mensal" },
  { valor: "SEMESTRAL", rotulo: "Semestral" },
  { valor: "ANUAL", rotulo: "Anual" },
];

interface PeriodoContagemSelectorProps {
  valor: PeriodoContagem;
  onChange: (periodo: PeriodoContagem) => void;
}

export function PeriodoContagemSelector({ valor, onChange }: PeriodoContagemSelectorProps) {
  return (
    <div className="periodo-contagem-selector" role="group" aria-label="Selecionar período">
      {OPCOES.map((opcao) => (
        <button
          key={opcao.valor}
          type="button"
          className={
            opcao.valor === valor
              ? "periodo-contagem-selector-item active"
              : "periodo-contagem-selector-item"
          }
          onClick={() => onChange(opcao.valor)}
          aria-pressed={opcao.valor === valor}
        >
          {opcao.rotulo}
        </button>
      ))}
    </div>
  );
}
