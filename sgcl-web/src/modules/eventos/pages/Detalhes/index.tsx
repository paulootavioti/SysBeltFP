import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { Layout } from "../../../../components/layout/Layout";
import { PageHeader } from "../../../../components/layout/PageHeader";
import { Button } from "../../../../components/ui/Button";
import { Badge } from "../../../../components/ui/Badge";
import { Card } from "../../../../components/ui/Card";
import { ErrorMessage } from "../../../../components/ui/ErrorMessage";
import { Loading } from "../../../../components/ui/Loading";

import { EventoService } from "../../services/EventoService";
import { getApiErrorMessage } from "../../../../shared/utils/getApiErrorMessage";
import { formatarData, formatarMoeda } from "../../../dashboard/utils/formatters";
import { TIPO_EVENTO_LABEL, STATUS_EVENTO_LABEL, type Evento, type StatusEvento } from "../../types";

import "./styles.css";

const VARIANTE_STATUS: Record<StatusEvento, "success" | "warning" | "danger" | "info" | "neutral"> = {
  RASCUNHO: "neutral",
  AGENDADO: "info",
  EM_ANDAMENTO: "warning",
  CONCLUIDO: "success",
  CANCELADO: "danger",
};

export function DetalheEvento() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const [evento, setEvento] = useState<Evento | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    if (!id) return;
    let ativo = true;

    EventoService.buscar(id)
      .then((dados) => {
        if (ativo) setEvento(dados ?? null);
      })
      .catch((error) => {
        if (ativo) setErro(getApiErrorMessage(error, "Erro ao carregar o evento."));
      })
      .finally(() => {
        if (ativo) setCarregando(false);
      });

    return () => {
      ativo = false;
    };
  }, [id]);

  return (
    <Layout>
      <div className="evento-detalhe-voltar">
        <Button type="button" variant="secondary" onClick={() => navigate("/eventos")}>
          ← Voltar
        </Button>
      </div>

      {carregando ? (
        <Loading />
      ) : erro ? (
        <ErrorMessage message={erro} />
      ) : !evento ? (
        <ErrorMessage message="Evento não encontrado." />
      ) : (
        <>
          <PageHeader
            title={evento.titulo}
            subtitle={`${TIPO_EVENTO_LABEL[evento.tipo]} • ${formatarData(evento.dataInicio)}`}
          />

          <div className="evento-detalhe-cabecalho">
            <Badge variant={VARIANTE_STATUS[evento.status]}>{STATUS_EVENTO_LABEL[evento.status]}</Badge>
            <Button type="button" onClick={() => navigate(`/eventos/${evento.id}/editar`)}>
              Editar
            </Button>
          </div>

          {evento.descricao && <p className="evento-detalhe-descricao">{evento.descricao}</p>}

          <div className="evento-detalhe-grid">
            <Card titulo="Local" valor={evento.local ?? "—"} />
            <Card titulo="Responsável" valor={evento.responsavel ?? "—"} />
            <Card
              titulo="Período"
              valor={evento.dataFim ? `${formatarData(evento.dataInicio)} a ${formatarData(evento.dataFim)}` : formatarData(evento.dataInicio)}
            />
            <Card
              titulo="Participantes"
              valor={
                evento.metaParticipantes != null
                  ? `${evento.participantesConfirmados ?? 0} de ${evento.metaParticipantes}`
                  : "—"
              }
            />
            {evento.investimento != null && <Card titulo="Investimento" valor={formatarMoeda(evento.investimento)} />}
            {evento.receitaGerada != null && <Card titulo="Receita Gerada" valor={formatarMoeda(evento.receitaGerada)} />}
          </div>
        </>
      )}
    </Layout>
  );
}
