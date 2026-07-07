import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { Layout } from "../../../../components/layout/Layout";
import { PageHeader } from "../../../../components/layout/PageHeader";
import { ErrorMessage } from "../../../../components/ui/ErrorMessage";
import { MensalidadeForm } from "../../components/MensalidadeForm";
import { MensalidadeService } from "../../services/MensalidadeService";
import { getApiErrorMessage } from "../../../../shared/utils/getApiErrorMessage";
import type { MensalidadeFormData } from "../../schema/mensalidade.schema";
export function NovaMensalidade() {
  const navigate = useNavigate();
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");
  async function handleSalvar(data: MensalidadeFormData) {
    try {
      setSalvando(true);
      setErro("");
      await MensalidadeService.criar(data);
      navigate("/mensalidades");
    } catch (error) {
      setErro(getApiErrorMessage(error, "Erro ao criar mensalidade."));
    } finally {
      setSalvando(false);
    }
  }
  return (
    <Layout>
      <PageHeader title="Nova Mensalidade" subtitle="Cadastrar uma nova mensalidade." />
      <ErrorMessage message={erro} />
      <MensalidadeForm loading={salvando} onSubmit={handleSalvar} />
    </Layout>
  );
}