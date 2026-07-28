import { useNavigate } from "react-router-dom";
import { Badge } from "../../../components/ui/Badge";
import { DashboardEmptyState } from "./DashboardEmptyState";
import type { AlertaDashboard, PrioridadeAlerta } from "../types";
import "./DashboardAlertList.css";

interface DashboardAlertListProps {
  alertas: AlertaDashboard[];
}

const VARIANTE_POR_PRIORIDADE: Record<PrioridadeAlerta, "danger" | "warning" | "info" | "neutral"> = {
  CRITICA: "danger",
  ALTA: "danger",
  MEDIA: "warning",
  BAIXA: "info",
};

const LABEL_PRIORIDADE: Record<PrioridadeAlerta, string> = {
  CRITICA: "Crítica",
  ALTA: "Alta",
  MEDIA: "Média",
  BAIXA: "Baixa",
};

export function DashboardAlertList({ alertas }: DashboardAlertListProps) {
  const navigate = useNavigate();

  if (alertas.length === 0) {
    return <DashboardEmptyState title="Nenhum alerta no momento" description="Tudo dentro do esperado." />;
  }

  return (
    <ul className="dashboard-alertas-lista">
      {alertas.map((alerta) => (
        <li key={alerta.id} className="dashboard-alerta-item">
          <div className="dashboard-alerta-conteudo">
            <div className="dashboard-alerta-cabecalho">
              <Badge variant={VARIANTE_POR_PRIORIDADE[alerta.prioridade]}>{LABEL_PRIORIDADE[alerta.prioridade]}</Badge>
              <strong>{alerta.titulo}</strong>
              {alerta.quantidade !== undefined && (
                <span className="dashboard-alerta-quantidade">{alerta.quantidade}</span>
              )}
            </div>
            <p>{alerta.descricao}</p>
          </div>

          {alerta.rota && (
            <button
              type="button"
              className="dashboard-alerta-acao"
              onClick={() => navigate(alerta.rota as string)}
              aria-label={`Ver detalhes: ${alerta.titulo}`}
            >
              Ver
            </button>
          )}
        </li>
      ))}
    </ul>
  );
}
