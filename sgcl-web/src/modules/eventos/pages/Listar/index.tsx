import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { Layout } from "../../../../components/layout/Layout";
import { PageHeader } from "../../../../components/layout/PageHeader";
import { Button } from "../../../../components/ui/Button";
import { Input } from "../../../../components/ui/Input";
import { Select } from "../../../../components/ui/Select";
import { Badge } from "../../../../components/ui/Badge";
import { Loading } from "../../../../components/ui/Loading";
import { ErrorMessage } from "../../../../components/ui/ErrorMessage";
import { EmptyState } from "../../../../components/ui/EmptyState";

import { EventoService, type FiltrosEvento } from "../../services/EventoService";
import { getApiErrorMessage } from "../../../../shared/utils/getApiErrorMessage";
import { formatarData } from "../../../dashboard/utils/formatters";
import {
  TIPO_EVENTO_LABEL,
  STATUS_EVENTO_LABEL,
  type Evento,
  type StatusEvento,
  type TipoEvento,
} from "../../types";

import "./styles.css";

const OPCOES_TIPO = Object.entries(TIPO_EVENTO_LABEL).map(([value, label]) => ({ value, label }));
const OPCOES_STATUS = Object.entries(STATUS_EVENTO_LABEL).map(([value, label]) => ({ value, label }));

const VARIANTE_STATUS: Record<StatusEvento, "success" | "warning" | "danger" | "info" | "neutral"> = {
  RASCUNHO: "neutral",
  AGENDADO: "info",
  EM_ANDAMENTO: "warning",
  CONCLUIDO: "success",
  CANCELADO: "danger",
};

export function Eventos() {
  const navigate = useNavigate();

  const [eventos, setEventos] = useState<Evento[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [excluindoId, setExcluindoId] = useState<number | null>(null);

  const [busca, setBusca] = useState("");
  const [tipo, setTipo] = useState("");
  const [status, setStatus] = useState("");
  const [dataInicial, setDataInicial] = useState("");
  const [dataFinal, setDataFinal] = useState("");

  async function carregar() {
    try {
      setCarregando(true);
      setErro("");

      const filtros: FiltrosEvento = {
        busca: busca || undefined,
        tipo: (tipo as TipoEvento) || undefined,
        status: (status as StatusEvento) || undefined,
        dataInicial: dataInicial || undefined,
        dataFinal: dataFinal || undefined,
      };

      const dados = await EventoService.listar(filtros);
      setEventos(dados);
    } catch (error) {
      setErro(getApiErrorMessage(error, "Erro ao carregar campanhas e seminários."));
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [busca, tipo, status, dataInicial, dataFinal]);

  async function handleExcluir(evento: Evento) {
    if (!window.confirm(`Excluir "${evento.titulo}"? Essa ação não pode ser desfeita.`)) {
      return;
    }

    try {
      setExcluindoId(evento.id);
      setErro("");
      await EventoService.excluir(String(evento.id));
      await carregar();
    } catch (error) {
      setErro(getApiErrorMessage(error, "Erro ao excluir o evento."));
    } finally {
      setExcluindoId(null);
    }
  }

  return (
    <Layout>
      <PageHeader title="Campanhas e Seminários" subtitle="Campanhas de matrícula, seminários, workshops e eventos da academia." />

      <div className="eventos-filtros">
        <Input label="Buscar" placeholder="Título do evento" value={busca} onChange={(e) => setBusca(e.target.value)} />
        <Select label="Tipo" options={OPCOES_TIPO} value={tipo} onChange={(e) => setTipo(e.target.value)} />
        <Select label="Status" options={OPCOES_STATUS} value={status} onChange={(e) => setStatus(e.target.value)} />
        <Input label="De" type="date" value={dataInicial} onChange={(e) => setDataInicial(e.target.value)} />
        <Input label="Até" type="date" value={dataFinal} onChange={(e) => setDataFinal(e.target.value)} />
      </div>

      <div className="eventos-acoes">
        <Button type="button" onClick={() => navigate("/eventos/novo")}>
          + Nova Campanha/Seminário
        </Button>
      </div>

      <ErrorMessage message={erro} />

      {carregando ? (
        <Loading />
      ) : eventos.length === 0 ? (
        <EmptyState
          title="Nenhuma campanha ou seminário encontrado"
          description="Ajuste os filtros ou cadastre um novo evento."
          action={
            <Button type="button" onClick={() => navigate("/eventos/novo")}>
              Criar evento
            </Button>
          }
        />
      ) : (
        <div className="eventos-grid">
          {eventos.map((evento) => (
            <article key={evento.id} className="eventos-card">
              <div className="eventos-card-cabecalho">
                <strong>{evento.titulo}</strong>
                <Badge variant={VARIANTE_STATUS[evento.status]}>{STATUS_EVENTO_LABEL[evento.status]}</Badge>
              </div>

              <p className="eventos-card-info">
                {TIPO_EVENTO_LABEL[evento.tipo]} • {formatarData(evento.dataInicio)}
                {evento.local ? ` • ${evento.local}` : ""}
              </p>

              {evento.metaParticipantes != null && (
                <p className="eventos-card-info">
                  {evento.participantesConfirmados ?? 0} de {evento.metaParticipantes} participante(s)
                </p>
              )}

              <div className="eventos-card-acoes">
                <Button type="button" size="sm" variant="secondary" onClick={() => navigate(`/eventos/${evento.id}`)}>
                  Ver
                </Button>
                <Button type="button" size="sm" variant="secondary" onClick={() => navigate(`/eventos/${evento.id}/editar`)}>
                  Editar
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="danger"
                  disabled={excluindoId === evento.id}
                  onClick={() => handleExcluir(evento)}
                >
                  {excluindoId === evento.id ? "Excluindo..." : "Excluir"}
                </Button>
              </div>
            </article>
          ))}
        </div>
      )}
    </Layout>
  );
}
