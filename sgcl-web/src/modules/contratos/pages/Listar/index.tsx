import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "../../../../components/layout/Layout";
import { PageHeader } from "../../../../components/layout/PageHeader";
import { Button } from "../../../../components/ui/Button";
import { ErrorMessage } from "../../../../components/ui/ErrorMessage";
import { Table } from "../../../../components/ui/Table";
import { EmptyState } from "../../../../components/ui/EmptyState";
import { Loading } from "../../../../components/ui/Loading";
import { Badge } from "../../../../components/ui/Badge";
import { Modal } from "../../../../components/ui/Modal";
import { useToast } from "../../../../contexts/toast/useToast";

import { useContratos } from "../../hooks/useContratos";
import { ContratoService } from "../../services/ContratoService";
import { ContratoForm } from "../../components/ContratoForm";
import { getApiErrorMessage } from "../../../../shared/utils/getApiErrorMessage";
import { formatarData, formatarMoeda } from "../../../dashboard/utils/formatters";
import { SITUACAO_CONTRATO_LABEL, type Contrato, type SituacaoContrato } from "../../types";
import type { ContratoFormData } from "../../schema/contrato.schema";

import "./styles.css";

const VARIANTE_SITUACAO: Record<SituacaoContrato, "success" | "warning" | "danger" | "neutral" | "info"> = {
  RASCUNHO: "neutral",
  PENDENTE_ASSINATURA: "warning",
  ASSINADO: "info",
  ATIVO: "success",
  SUSPENSO: "warning",
  CANCELADO: "danger",
  ENCERRADO: "neutral",
  RENOVADO: "neutral",
};

export function Contratos() {
  const navigate = useNavigate();
  const toast = useToast();
  const { contratos, loading, erro, setErro, carregarContratos } = useContratos();
  const [modalAberto, setModalAberto] = useState(false);
  const [salvando, setSalvando] = useState(false);

  function handleNovoContrato() {
    setModalAberto(true);
  }

  async function handleSalvarContrato(data: ContratoFormData) {
    try {
      setSalvando(true);
      setErro("");

      const contrato = await ContratoService.criar(data);
      toast.success("Contrato gerado com sucesso.");

      await carregarContratos();
      setModalAberto(false);
      navigate(`/contratos/${contrato.id}`);
    } catch (error) {
      const mensagem = getApiErrorMessage(error, "Erro ao gerar contrato.");
      setErro(mensagem);
      toast.error(mensagem);
    } finally {
      setSalvando(false);
    }
  }

  const columns = [
    { header: "Número", accessor: "numero" as const },
    { header: "Aluno", accessor: "aluno" as const, render: (c: Contrato) => c.aluno?.nome },
    {
      header: "Contratante",
      accessor: "contratanteResponsavel" as const,
      render: (c: Contrato) => c.contratanteResponsavel?.nome ?? c.aluno?.nome,
    },
    { header: "Valor", accessor: "valor" as const, render: (c: Contrato) => formatarMoeda(c.valor) },
    { header: "Início Vigência", accessor: "dataInicioVigencia" as const, render: (c: Contrato) => formatarData(c.dataInicioVigencia) },
    {
      header: "Situação",
      accessor: "situacao" as const,
      render: (c: Contrato) => <Badge variant={VARIANTE_SITUACAO[c.situacao]}>{SITUACAO_CONTRATO_LABEL[c.situacao]}</Badge>,
    },
    {
      header: "Ações",
      accessor: "id" as const,
      render: (c: Contrato) => (
        <div className="contratos-table-actions">
          <Button type="button" size="sm" onClick={() => navigate(`/contratos/${c.id}`)}>
            Ver Detalhes
          </Button>
        </div>
      ),
    },
  ];

  return (
    <Layout>
      <PageHeader title="Contratos" subtitle="Contratos vinculados à matrícula dos alunos." />

      <div className="contratos-acoes">
        <Button type="button" onClick={handleNovoContrato}>
          + Novo Contrato
        </Button>
      </div>

      <ErrorMessage message={erro} />

      {loading ? (
        <Loading />
      ) : contratos.length === 0 ? (
        <EmptyState
          title="Nenhum contrato cadastrado"
          description="Gere um contrato para vincular a matrícula de um aluno."
          action={
            <Button type="button" onClick={handleNovoContrato}>
              Gerar contrato
            </Button>
          }
        />
      ) : (
        <Table columns={columns} data={contratos} />
      )}

      <Modal open={modalAberto} title="Novo Contrato" onClose={() => setModalAberto(false)}>
        <ContratoForm loading={salvando} onSubmit={handleSalvarContrato} />
      </Modal>
    </Layout>
  );
}
