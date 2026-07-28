import { LuTrendingDown, LuTrendingUp, LuMinus } from "react-icons/lu";
import { formatarPercentual } from "../utils/formatters";
import "./DashboardVariation.css";

interface DashboardVariationProps {
  percentual: number | null;
  // Pra indicadores em que uma queda é positiva (inadimplência,
  // cancelamentos) — inverte a leitura visual (verde/vermelho), nunca a
  // matemática do percentual em si.
  inverso?: boolean;
  sufixo?: string;
}

const LIMIAR_ESTAVEL = 0.05;

export function DashboardVariation({ percentual, inverso = false, sufixo = "em relação ao período anterior" }: DashboardVariationProps) {
  if (percentual === null) {
    return (
      <span className="dashboard-variacao dashboard-variacao-novo">
        <LuTrendingUp size={14} aria-hidden="true" />
        Novo no período
      </span>
    );
  }

  const estavel = Math.abs(percentual) < LIMIAR_ESTAVEL;
  const subiu = percentual > 0;

  const positivo = estavel ? null : inverso ? !subiu : subiu;

  const classe = estavel
    ? "dashboard-variacao-estavel"
    : positivo
      ? "dashboard-variacao-positiva"
      : "dashboard-variacao-negativa";

  const Icone = estavel ? LuMinus : subiu ? LuTrendingUp : LuTrendingDown;
  const sinal = percentual > 0 ? "+" : "";

  return (
    <span className={`dashboard-variacao ${classe}`}>
      <Icone size={14} aria-hidden="true" />
      {estavel ? "Estável" : `${sinal}${formatarPercentual(percentual)}`} {sufixo}
    </span>
  );
}
