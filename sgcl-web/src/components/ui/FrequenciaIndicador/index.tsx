import { varianteFrequencia } from "../FrequenciaBadge/varianteFrequencia";

import "./styles.css";

interface FrequenciaIndicadorProps {
  label: string;
  percentual: number;
}

// Percentual + barra preenchida, cor por faixa de aproveitamento (mesmo
// corte de varianteFrequencia: ≥80% sucesso, 60-79% atenção, <60% erro).
// Complementa o FrequenciaBadge (pill de texto) — usar aqui quando a tela
// precisa de um indicador mais visual (prontuário, detalhes do aluno/turma,
// Portal da Família).
export function FrequenciaIndicador({ label, percentual }: FrequenciaIndicadorProps) {
  const variante = varianteFrequencia(percentual);
  const largura = Math.max(0, Math.min(100, percentual));

  return (
    <div className="frequencia-indicador">
      <div className="frequencia-indicador-cabecalho">
        <span className="frequencia-indicador-label">{label}</span>
        <span className="frequencia-indicador-valor">{percentual}%</span>
      </div>

      <div className="frequencia-indicador-barra">
        <div
          className={`frequencia-indicador-preenchimento frequencia-indicador-${variante}`}
          style={{ width: `${largura}%` }}
        />
      </div>
    </div>
  );
}
