import { useNavigate } from "react-router-dom";
import { Button } from "../../../components/ui/Button";
import { Badge } from "../../../components/ui/Badge";
import { formatarData } from "../utils/formatters";
import { TIPO_EVENTO_LABEL, STATUS_EVENTO_LABEL, type Evento, type StatusEvento } from "../../eventos/types";
import "./progressBar.css";
import "./DashboardEvents.css";

interface DashboardEventsProps {
  eventos: Evento[];
}

const VARIANTE_STATUS: Record<StatusEvento, "success" | "warning" | "danger" | "info" | "neutral"> = {
  RASCUNHO: "neutral",
  AGENDADO: "info",
  EM_ANDAMENTO: "warning",
  CONCLUIDO: "success",
  CANCELADO: "danger",
};

const STATUS_ATIVOS: StatusEvento[] = ["AGENDADO", "EM_ANDAMENTO"];

export function DashboardEvents({ eventos }: DashboardEventsProps) {
  const navigate = useNavigate();

  const ativos = eventos.filter((evento) => STATUS_ATIVOS.includes(evento.status));

  const proximoEvento = ativos
    .slice()
    .sort((a, b) => new Date(a.dataInicio).getTime() - new Date(b.dataInicio).getTime())[0];

  return (
    <div className="dashboard-eventos">
      <div className="dashboard-eventos-resumo">
        <div className="dashboard-eventos-contador">
          <span className="dashboard-eventos-contador-numero">{ativos.length}</span>
          <span>evento(s) ativo(s)</span>
        </div>

        {!proximoEvento ? (
          <p className="dashboard-vazio">Nenhuma campanha ou seminário agendado.</p>
        ) : (
          <article className="dashboard-evento-card">
            <div className="dashboard-evento-cabecalho">
              <strong>{proximoEvento.titulo}</strong>
              <Badge variant={VARIANTE_STATUS[proximoEvento.status]}>{STATUS_EVENTO_LABEL[proximoEvento.status]}</Badge>
            </div>

            <p className="dashboard-evento-info">
              {TIPO_EVENTO_LABEL[proximoEvento.tipo]} • {formatarData(proximoEvento.dataInicio)}
            </p>

            {proximoEvento.metaParticipantes != null && (
              <>
                <p className="dashboard-evento-info">
                  {proximoEvento.participantesConfirmados ?? 0} de {proximoEvento.metaParticipantes} participante(s) confirmado(s)
                </p>
                <div
                  className="dashboard-meta-barra"
                  role="progressbar"
                  aria-label={`Progresso de inscrições: ${proximoEvento.titulo}`}
                  aria-valuenow={Math.round(
                    Math.min(100, ((proximoEvento.participantesConfirmados ?? 0) / proximoEvento.metaParticipantes) * 100)
                  )}
                  aria-valuemin={0}
                  aria-valuemax={100}
                >
                  <div
                    className="dashboard-meta-barra-preenchida"
                    style={{
                      width: `${Math.min(
                        100,
                        ((proximoEvento.participantesConfirmados ?? 0) / proximoEvento.metaParticipantes) * 100
                      )}%`,
                    }}
                  />
                </div>
              </>
            )}
          </article>
        )}
      </div>

      <div className="dashboard-eventos-acoes">
        <Button type="button" variant="secondary" onClick={() => navigate("/eventos")}>
          Ver todos
        </Button>
        <Button type="button" onClick={() => navigate("/eventos/novo")}>
          Criar evento
        </Button>
      </div>
    </div>
  );
}
