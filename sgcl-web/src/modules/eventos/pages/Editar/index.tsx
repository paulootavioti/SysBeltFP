import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { Layout } from "../../../../components/layout/Layout";
import { PageHeader } from "../../../../components/layout/PageHeader";
import { Button } from "../../../../components/ui/Button";
import { ErrorMessage } from "../../../../components/ui/ErrorMessage";
import { Loading } from "../../../../components/ui/Loading";

import { EventoForm } from "../../components/EventoForm";
import { EventoService } from "../../services/EventoService";
import { getApiErrorMessage } from "../../../../shared/utils/getApiErrorMessage";
import type { EventoFormData } from "../../schema/evento.schema";
import type { Evento } from "../../types";

import "./styles.css";

export function EditarEvento() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const [evento, setEvento] = useState<Evento | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
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

  async function handleSubmit(data: EventoFormData) {
    if (!id) return;

    try {
      setSalvando(true);
      setErro("");
      await EventoService.atualizar(id, data);
      navigate(`/eventos/${id}`);
    } catch (error) {
      setErro(getApiErrorMessage(error, "Erro ao salvar as alterações."));
    } finally {
      setSalvando(false);
    }
  }

  return (
    <Layout>
      <div className="eventos-voltar">
        <Button type="button" variant="secondary" onClick={() => navigate(`/eventos/${id}`)}>
          ← Voltar
        </Button>
      </div>

      <PageHeader title="Editar Campanha/Seminário" subtitle="Atualize os dados do evento." />

      <ErrorMessage message={erro} />

      {carregando ? (
        <Loading />
      ) : !evento ? (
        <ErrorMessage message="Evento não encontrado." />
      ) : (
        <EventoForm loading={salvando} valoresIniciais={evento} onSubmit={handleSubmit} />
      )}
    </Layout>
  );
}
