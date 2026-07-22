import "./styles.css";

export type PeriodoOpcao = "DIARIO" | "SEMANAL" | "MENSAL" | "ANUAL";

const OPCOES: { valor: PeriodoOpcao; rotulo: string }[] = [
  { valor: "DIARIO", rotulo: "Diário" },
  { valor: "SEMANAL", rotulo: "Semanal" },
  { valor: "MENSAL", rotulo: "Mensal" },
  { valor: "ANUAL", rotulo: "Anual" },
];

interface PeriodoSelectorProps {
  valor: PeriodoOpcao;
  onChange: (periodo: PeriodoOpcao) => void;
}

export function PeriodoSelector({ valor, onChange }: PeriodoSelectorProps) {
  return (
    <div className="periodo-selector" role="group" aria-label="Selecionar período">
      {OPCOES.map((opcao) => (
        <button
          key={opcao.valor}
          type="button"
          className={opcao.valor === valor ? "periodo-selector-item active" : "periodo-selector-item"}
          onClick={() => onChange(opcao.valor)}
          aria-pressed={opcao.valor === valor}
        >
          {opcao.rotulo}
        </button>
      ))}
    </div>
  );
}
