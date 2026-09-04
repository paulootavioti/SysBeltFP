import { useNavigate } from "react-router-dom";
import { Situacao } from "../../../components/ui/Situacao";
import { DashboardEmptyState } from "./DashboardEmptyState";
import type { AlertaDashboard } from "../types";
import "./DashboardAlertList.css";

interface DashboardAlertListProps {
  alertas: AlertaDashboard[];
}

const ACAO_POR_ROTA: Record<string, string> = { "/mensalidades": "Cobrar", "/financeiro": "Abrir", "/alunos": "Abrir", "/graduacoes/proximas": "Revisar", "/metas": "Revisar", "/eventos": "Divulgar" };

export function DashboardAlertList({ alertas }: DashboardAlertListProps) {
  const navigate = useNavigate();

  if (alertas.length === 0) {
    return <DashboardEmptyState title="Nenhum alerta no momento" description="Tudo dentro do esperado." />;
  }

  return (
    <ul className="dashboard-alertas-lista">
      {[...alertas].sort((a, b) => (a.prazoDias ?? 99) - (b.prazoDias ?? 99)).map((alerta) => {
        const prazo = alerta.prazoDias ?? 12;
        const hoje = prazo <= 0;
        return <li key={alerta.id} className={`dashboard-alerta-item${hoje ? " dashboard-alerta-item-hoje" : ""}`}>
          <div className="dashboard-alerta-conteudo">
            <div className="dashboard-alerta-cabecalho">
              <strong>{alerta.titulo}</strong>
              {alerta.quantidade !== undefined && (
                <span className="dashboard-alerta-quantidade">{alerta.quantidade}</span>
              )}
            </div>
            <p>{alerta.descricao}</p>
            <Situacao degrau={hoje ? "acao" : "atencao"}>{hoje ? "Hoje" : `Em ${prazo} dias`}</Situacao>
          </div>

          {alerta.rota && (
            <button
              type="button"
              className="dashboard-alerta-acao"
              onClick={() => navigate(alerta.rota as string)}
              aria-label={`${ACAO_POR_ROTA[alerta.rota] ?? "Abrir"}: ${alerta.titulo}`}
            >
              {ACAO_POR_ROTA[alerta.rota] ?? "Abrir"}
            </button>
          )}
        </li>;
      })}
    </ul>
  );
}
