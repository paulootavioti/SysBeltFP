import { useNavigate } from "react-router-dom";
import { Button } from "../../../components/ui/Button";
import { Situacao, type DegrauSituacao } from "../../../components/ui/Situacao";
import { DashboardEmptyState } from "./DashboardEmptyState";
import { formatarData, formatarMoeda, formatarPercentual } from "../utils/formatters";
import type { UnidadeDashboard } from "../types";
import type { Evento } from "../../eventos/types";
import "./DashboardUnits.css";

interface DashboardUnitsProps {
  unidades: UnidadeDashboard[];
  eventos: Evento[];
}

const DEGRAU_STATUS: Record<UnidadeDashboard["status"], DegrauSituacao> = {
  ATIVA: "neutro", INATIVA: "inativo", EM_IMPLANTACAO: "atencao",
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
      <div className="dashboard-unidades-tabela-wrap">
        <table className="dashboard-unidades-tabela">
          <thead><tr><th>Unidade</th><th>Situação</th><th>Alunos</th><th>Turmas</th><th>Ocupação das arenas</th><th>Receita</th><th aria-label="Ação" /></tr></thead>
          <tbody>
        {unidades.map((unidade) => {
          const proximoEvento = eventos
            .filter((evento) => evento.unidadeId === unidade.id && evento.status !== "CANCELADO" && evento.status !== "CONCLUIDO")
            .sort((a, b) => new Date(a.dataInicio).getTime() - new Date(b.dataInicio).getTime())[0];

          return (
            <tr
              key={unidade.id}
            >
              <td><strong>{unidade.nome}</strong><small className="dashboard-unidade-evento">
                {proximoEvento
                  ? `Próximo evento: ${proximoEvento.titulo} (${formatarData(proximoEvento.dataInicio)})`
                  : "Nenhum evento agendado."}
              </small></td>
              <td><Situacao degrau={DEGRAU_STATUS[unidade.status]}>{LABEL_STATUS[unidade.status]}</Situacao></td>
              <td>{unidade.alunosAtivos}</td>
              <td>{unidade.turmasAtivas}</td>
              <td><div className="dashboard-unidade-ocupacao"><div><i style={{ width: `${Math.min(100, unidade.ocupacaoArenas)}%` }} /></div><strong>{formatarPercentual(unidade.ocupacaoArenas)}</strong></div></td>
              <td>{formatarMoeda(unidade.receitaPeriodo)}</td>
              <td><Button type="button" variant="secondary" size="sm" onClick={() => navigate("/arenas")}>Abrir</Button></td>
            </tr>
          );
        })}
          </tbody>
        </table>
      </div>

      <div className="dashboard-unidades-rodape">
        <Button type="button" variant="secondary" onClick={() => navigate("/arenas")}>
          Ver todas as arenas
        </Button>
      </div>
    </div>
  );
}
