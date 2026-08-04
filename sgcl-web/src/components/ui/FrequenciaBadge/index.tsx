import { Badge } from "../Badge";
import { varianteFrequencia } from "./varianteFrequencia";

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
