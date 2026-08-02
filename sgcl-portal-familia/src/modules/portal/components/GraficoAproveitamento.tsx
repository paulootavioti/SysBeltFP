import { calcularAproveitamentoMensal } from "../utils/calcularAproveitamentoMensal";
import type { Frequencia } from "../types";

interface GraficoAproveitamentoProps {
  registros: Frequencia[];
}

export function GraficoAproveitamento({ registros }: GraficoAproveitamentoProps) {
  const meses = calcularAproveitamentoMensal(registros);

  if (meses.length === 0) return null;

  return (
    <div className="grafico-aproveitamento" role="img" aria-label="Aproveitamento de presença por mês">
      <p className="grafico-aproveitamento-titulo">Aproveitamento por mês</p>

      <div className="grafico-aproveitamento-scroll">
        <div className="grafico-aproveitamento-barras">
          {meses.map((mes) => (
            <div key={mes.chave} className="grafico-aproveitamento-coluna" title={`${mes.label}: ${mes.percentual}% de presença`}>
              <span className="grafico-aproveitamento-valor">{mes.percentual}%</span>
              <div className="grafico-aproveitamento-trilha">
                <div className="grafico-aproveitamento-barra" style={{ height: `${Math.max(mes.percentual, 4)}%` }} />
              </div>
              <span className="grafico-aproveitamento-mes">{mes.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
