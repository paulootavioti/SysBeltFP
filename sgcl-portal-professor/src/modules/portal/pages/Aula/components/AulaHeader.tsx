import "./AulaHeader.css";

const ETAPAS = [
  { numero: 1, rotulo: "Presença" },
  { numero: 2, rotulo: "Plano" },
  { numero: 3, rotulo: "Notas" },
  { numero: 4, rotulo: "Foto" },
] as const;

interface AulaHeaderProps {
  turmaNome: string;
  planoTitulo: string | null;
  tempo: string;
  etapaAtual: number;
  onEtapaClick: (etapa: number) => void;
  onSair: () => void;
}

export function AulaHeader({ turmaNome, planoTitulo, tempo, etapaAtual, onEtapaClick, onSair }: AulaHeaderProps) {
  return (
    <header className="aula-header">
      <div className="aula-header-topo">
        <button type="button" className="aula-header-sair" onClick={onSair}>
          Sair
        </button>

        <div className="aula-header-titulo">
          <strong>{turmaNome}</strong>
          {planoTitulo && <span>{planoTitulo}</span>}
        </div>

        <span className="aula-header-cronometro">{tempo}</span>
      </div>

      <div className="aula-header-stepper">
        {ETAPAS.map((etapa) => (
          <button
            key={etapa.numero}
            type="button"
            className={`aula-header-pilula${etapaAtual === etapa.numero ? " aula-header-pilula-ativa" : ""}`}
            onClick={() => onEtapaClick(etapa.numero)}
          >
            {etapa.rotulo}
          </button>
        ))}
      </div>
    </header>
  );
}
