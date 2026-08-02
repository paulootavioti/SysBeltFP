import { Badge } from "../Badge";
import { varianteFrequencia } from "./varianteFrequencia";

import "./styles.css";

interface FrequenciaBadgeProps {
  label: string;
  percentual: number;
}

export function FrequenciaBadge({ label, percentual }: FrequenciaBadgeProps) {
  return (
    <Badge variant={varianteFrequencia(percentual)}>
      {label}: {percentual}%
    </Badge>
  );
}

interface FrequenciaCardProps {
  frequenciaMes: number;
  frequenciaAno: number;
}

// par de badges mês/ano — usado no cabeçalho do prontuário, da ficha do
// aluno e (com a média da turma) em Turmas > Detalhes.
export function FrequenciaCard({ frequenciaMes, frequenciaAno }: FrequenciaCardProps) {
  return (
    <div className="frequencia-card">
      <FrequenciaBadge label="Mês" percentual={frequenciaMes} />
      <FrequenciaBadge label="Ano" percentual={frequenciaAno} />
    </div>
  );
}
