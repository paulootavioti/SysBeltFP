import { useNavigate } from "react-router-dom";
import { Button } from "../../../components/ui/Button";
import { Badge } from "../../../components/ui/Badge";
import { DashboardEmptyState } from "./DashboardEmptyState";
import { formatarData, formatarMoeda, formatarPercentual } from "../utils/formatters";
import type { UnidadeDashboard } from "../types";
import type { Evento } from "../../eventos/types";
import "./DashboardUnits.css";

interface DashboardUnitsProps {
  unidades: UnidadeDashboard[];
  eventos: Evento[];
}

const VARIANTE_STATUS: Record<UnidadeDashboard["status"], "success" | "danger" | "warning"> = {
  ATIVA: "success",
  INATIVA: "danger",
  EM_IMPLANTACAO: "warning",
};

const LABEL_STATUS: Record<UnidadeDashboard["status"], string> = {
  ATIVA: "Ativa",
  INATIVA: "Inativa",
  EM_IMPLANTACAO: "Em implantação",
};

export function DashboardUnits({ unidades, eventos }: DashboardUnitsProps) {
  const navigate = useNavigate();

  if (unidades.length === 0) {
    return <DashboardEmptyState title="Nenhuma unidade cadastrada" />;
  }

  return (
    <div>
      <div className="dashboard-unidades-grid">
        {unidades.map((unidade) => {
          const proximoEvento = eventos
            .filter((evento) => evento.unidadeId === String(unidade.id) && evento.status !== "CANCELADO" && evento.status !== "CONCLUIDO")
            .sort((a, b) => new Date(a.dataInicio).getTime() - new Date(b.dataInicio).getTime())[0];

          return (
            <button
              key={unidade.id}
              type="button"
              className="dashboard-unidade-card"
              // Não existe hoje uma tela de detalhe por unidade (só a
              // listagem em /unidades) — o card leva pra lá até essa tela
              // existir.
              onClick={() => navigate("/unidades")}
            >
              <div className="dashboard-unidade-cabecalho">
                <strong>{unidade.nome}</strong>
                <Badge variant={VARIANTE_STATUS[unidade.status]}>{LABEL_STATUS[unidade.status]}</Badge>
              </div>

              <dl className="dashboard-unidade-info">
                <div>
                  <dt>Alunos ativos</dt>
                  <dd>{unidade.alunosAtivos}</dd>
                </div>
                <div>
                  <dt>Professores</dt>
                  <dd>{unidade.professores}</dd>
                </div>
                <div>
                  <dt>Turmas ativas</dt>
                  <dd>{unidade.turmasAtivas}</dd>
                </div>
                <div>
                  <dt>Receita do período</dt>
                  <dd>{formatarMoeda(unidade.receitaPeriodo)}</dd>
                </div>
                <div>
                  <dt>Mensalidades vencidas</dt>
                  <dd>{unidade.mensalidadesVencidas}</dd>
                </div>
                <div>
                  <dt>Frequência média</dt>
                  <dd>{formatarPercentual(unidade.taxaFrequencia)}</dd>
                </div>
              </dl>

              <p className="dashboard-unidade-evento">
                {proximoEvento
                  ? `Próximo evento: ${proximoEvento.titulo} (${formatarData(proximoEvento.dataInicio)})`
                  : "Nenhum evento agendado."}
              </p>
            </button>
          );
        })}
      </div>

      <div className="dashboard-unidades-rodape">
        <Button type="button" variant="secondary" onClick={() => navigate("/unidades")}>
          Ver todas as unidades
        </Button>
      </div>
    </div>
  );
}
