import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { Layout } from "../../../../components/layout/Layout";
import { PageHeader } from "../../../../components/layout/PageHeader";
import { Button } from "../../../../components/ui/Button";
import { ErrorMessage } from "../../../../components/ui/ErrorMessage";

import { EventoForm } from "../../components/EventoForm";
import { EventoService } from "../../services/EventoService";
import { getApiErrorMessage } from "../../../../shared/utils/getApiErrorMessage";
import type { EventoFormData } from "../../schema/evento.schema";

import "./styles.css";

export function NovoEvento() {
  const navigate = useNavigate();
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  async function handleSubmit(data: EventoFormData) {
    try {
      setSalvando(true);
      setErro("");
      const evento = await EventoService.criar(data);
      navigate(`/eventos/${evento.id}`);
    } catch (error) {
      setErro(getApiErrorMessage(error, "Erro ao criar o evento."));
    } finally {
      setSalvando(false);
    }
  }

  return (
    <Layout>
      <div className="eventos-voltar">
        <Button type="button" variant="secondary" onClick={() => navigate("/eventos")}>
          ← Voltar
        </Button>
      </div>

      <PageHeader title="Nova Campanha/Seminário" subtitle="Cadastre uma nova campanha, seminário, workshop ou evento." />

      <ErrorMessage message={erro} />

      <EventoForm loading={salvando} onSubmit={handleSubmit} />
    </Layout>
  );
}
