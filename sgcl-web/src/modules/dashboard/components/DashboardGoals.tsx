import { useNavigate } from "react-router-dom";
import { Button } from "../../../components/ui/Button";
import { Badge } from "../../../components/ui/Badge";
import { DashboardEmptyState } from "./DashboardEmptyState";
import { formatarData, formatarMoeda, formatarNumero, formatarPercentual } from "../utils/formatters";
import type { MetaDashboard, StatusMeta } from "../../metas/types";
import "./progressBar.css";
import "./DashboardGoals.css";

interface DashboardGoalsProps {
  metas: MetaDashboard[];
  // false na própria página /metas, onde o botão "Gerenciar metas" seria
  // redundante (o usuário já está lá).
  mostrarBotaoGerenciar?: boolean;
}

const LABEL_STATUS: Record<StatusMeta, string> = {
  NAO_INICIADA: "Não iniciada",
  EM_ANDAMENTO: "Em andamento",
  ATINGIDA: "Atingida",
  ATRASADA: "Atrasada",
};

const VARIANTE_STATUS: Record<StatusMeta, "success" | "warning" | "danger" | "neutral"> = {
  NAO_INICIADA: "neutral",
  EM_ANDAMENTO: "warning",
  ATINGIDA: "success",
  ATRASADA: "danger",
};

function formatarValorMeta(valor: number, unidade: MetaDashboard["unidade"]): string {
  if (unidade === "MOEDA") return formatarMoeda(valor);
  if (unidade === "PERCENTUAL") return formatarPercentual(valor);
  return formatarNumero(valor);
}

export function DashboardGoals({ metas, mostrarBotaoGerenciar = true }: DashboardGoalsProps) {
  const navigate = useNavigate();

  return (
    <div>
      {metas.length === 0 ? (
        <DashboardEmptyState title="Nenhuma meta cadastrada" description="Cadastre metas de desempenho pra acompanhar aqui." />
      ) : (
        <div className="dashboard-metas-grid">
          {metas.map((meta) => {
            const percentualBarra = Math.min(100, Math.max(0, meta.percentualAtingido));
            const superada = meta.percentualAtingido > 100;

            return (
              <article key={meta.id} className="dashboard-meta-card">
                <div className="dashboard-meta-cabecalho">
                  <strong>{meta.nome}</strong>
                  <Badge variant={VARIANTE_STATUS[meta.status]}>{LABEL_STATUS[meta.status]}</Badge>
                </div>

                <p className="dashboard-meta-valores">
                  {formatarValorMeta(meta.valorAtual, meta.unidade)} de {formatarValorMeta(meta.valorMeta, meta.unidade)}
                </p>

                <div
                  className="dashboard-meta-barra"
                  role="progressbar"
                  aria-label={`Progresso da meta ${meta.nome}`}
                  aria-valuenow={Math.round(percentualBarra)}
                  aria-valuemin={0}
                  aria-valuemax={100}
                >
                  <div className="dashboard-meta-barra-preenchida" style={{ width: `${percentualBarra}%` }} />
                </div>

                <p className="dashboard-meta-percentual">
                  {superada
                    ? `Meta superada em ${formatarPercentual(meta.percentualAtingido - 100)}`
                    : `${formatarPercentual(meta.percentualAtingido)} alcançado`}
                </p>

                <p className="dashboard-meta-prazo">Prazo: {formatarData(meta.dataLimite)}</p>

                <Button type="button" variant="secondary" size="sm" onClick={() => navigate("/metas")}>
                  Ver detalhes
                </Button>
              </article>
            );
          })}
        </div>
      )}

      {mostrarBotaoGerenciar && (
        <div className="dashboard-metas-rodape">
          <Button type="button" onClick={() => navigate("/metas")}>
            Gerenciar metas
          </Button>
        </div>
      )}
    </div>
  );
}
