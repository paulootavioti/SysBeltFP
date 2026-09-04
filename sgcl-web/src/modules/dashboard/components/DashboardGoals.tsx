import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../../../components/ui/Button";
import { Situacao, type DegrauSituacao } from "../../../components/ui/Situacao";
import { DashboardEmptyState } from "./DashboardEmptyState";
import { formatarData, formatarMoeda, formatarNumero, formatarPercentual } from "../utils/formatters";
import { TIPOS_META_REDUCAO, type MetaDashboard, type StatusMeta } from "../../metas/types";
import "./progressBar.css";
import "./DashboardGoals.css";

interface DashboardGoalsProps {
  metas: MetaDashboard[];
  // false na própria página /metas, onde o botão "Gerenciar metas" seria
  // redundante (o usuário já está lá).
  mostrarBotaoGerenciar?: boolean;
  // Quando informado, substitui o botão "Ver detalhes" de cada card —
  // usado na página /metas pra oferecer Editar/Excluir em vez de navegar
  // pra ela mesma.
  renderAcoes?: (meta: MetaDashboard) => ReactNode;
}

const LABEL_STATUS: Record<StatusMeta, string> = {
  NAO_INICIADA: "Não iniciada",
  EM_ANDAMENTO: "Em andamento",
  ATINGIDA: "Atingida",
  ATRASADA: "Atrasada",
};

const DEGRAU_STATUS: Record<StatusMeta, DegrauSituacao> = {
  NAO_INICIADA: "neutro", EM_ANDAMENTO: "atencao", ATINGIDA: "neutro", ATRASADA: "acao",
};

function formatarValorMeta(valor: number, unidade: MetaDashboard["unidade"]): string {
  if (unidade === "MOEDA") return formatarMoeda(valor);
  if (unidade === "PERCENTUAL") return formatarPercentual(valor);
  return formatarNumero(valor);
}

export function DashboardGoals({ metas, mostrarBotaoGerenciar = true, renderAcoes }: DashboardGoalsProps) {
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
            const piorQueMeta = TIPOS_META_REDUCAO.includes(meta.tipo) && meta.valorAtual > meta.valorMeta;
            const faltam = Math.max(0, meta.valorMeta - meta.valorAtual);
            const dias = Math.max(0, Math.ceil((new Date(meta.dataLimite).getTime() - Date.now()) / 86_400_000));

            return (
              <article key={meta.id} className="dashboard-meta-card">
                <div className="dashboard-meta-cabecalho">
                  <strong>{meta.nome}</strong>
                  <Situacao degrau={DEGRAU_STATUS[meta.status]}>{LABEL_STATUS[meta.status]}</Situacao>
                </div>

                <p className="dashboard-meta-valores">
                  {formatarValorMeta(meta.valorAtual, meta.unidade)} de {formatarValorMeta(meta.valorMeta, meta.unidade)}
                </p>

                <div
                  className={`dashboard-meta-barra${piorQueMeta ? " dashboard-meta-barra-alerta" : ""}`}
                  role="progressbar"
                  aria-label={`Progresso da meta ${meta.nome}`}
                  aria-valuenow={Math.round(percentualBarra)}
                  aria-valuemin={0}
                  aria-valuemax={100}
                >
                  <div className="dashboard-meta-barra-preenchida" style={{ width: `${percentualBarra}%` }} />
                </div>

                <p className="dashboard-meta-percentual">
                  {faltam > 0 ? `faltam ${formatarValorMeta(faltam, meta.unidade)} · ${dias} dias` : superada
                    ? `Meta superada em ${formatarPercentual(meta.percentualAtingido - 100)}`
                    : "Meta atingida"}
                </p>

                <p className="dashboard-meta-prazo">Prazo: {formatarData(meta.dataLimite)}</p>

                {renderAcoes ? (
                  renderAcoes(meta)
                ) : (
                  <Button type="button" variant="secondary" size="sm" onClick={() => navigate("/metas")}>
                    Ver detalhes
                  </Button>
                )}
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
