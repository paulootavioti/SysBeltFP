import { useEffect, useMemo, useState } from "react";

import { Layout } from "../../../../components/layout/Layout";
import { PageHeader } from "../../../../components/layout/PageHeader";
import { Select } from "../../../../components/ui/Select";
import { ErrorMessage } from "../../../../components/ui/ErrorMessage";
import { Table } from "../../../../components/ui/Table";
import { EmptyState } from "../../../../components/ui/EmptyState";
import { Loading } from "../../../../components/ui/Loading";
import { useToast } from "../../../../contexts/toast/useToast";
import { getApiErrorMessage } from "../../../../shared/utils/getApiErrorMessage";

import { LeadsService } from "../../services/LeadsService";
import { STATUS_LEAD_LABEL, type Lead, type StatusLead } from "../../types";

import "./styles.css";

const OPCOES_STATUS = Object.entries(STATUS_LEAD_LABEL).map(([value, label]) => ({ value, label }));

export function Leads() {
  const toast = useToast();

  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");

  const [filtroStatus, setFiltroStatus] = useState<StatusLead | "">("");

  const filtros = useMemo(() => ({ status: filtroStatus || undefined }), [filtroStatus]);

  async function carregar() {
    try {
      setLoading(true);
      setErro("");
      const data = await LeadsService.listar(filtros);
      setLeads(data);
    } catch (error) {
      setErro(getApiErrorMessage(error, "Erro ao carregar leads."));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtros]);

  async function handleAlterarStatus(id: number, status: string) {
    try {
      await LeadsService.atualizarStatus(id, status as StatusLead);
      await carregar();
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Erro ao atualizar status do lead."));
    }
  }

  const columns = [
    { header: "Nome", accessor: "nome" as const },
    { header: "WhatsApp", accessor: "contato" as const },
    { header: "Interesse", accessor: "interesse" as const },
    {
      header: "Status",
      accessor: "status" as const,
      render: (lead: Lead) => (
        <Select
          value={lead.status}
          options={OPCOES_STATUS}
          onChange={(e) => handleAlterarStatus(lead.id, e.target.value)}
          className="leads-status-select"
        />
      ),
    },
    {
      header: "Recebido em",
      accessor: "criadoEm" as const,
      render: (lead: Lead) => new Date(lead.criadoEm).toLocaleDateString("pt-BR"),
    },
  ];

  return (
    <Layout>
      <PageHeader title="Leads" subtitle="Contatos recebidos pelo formulário da landing page pública." />

      <ErrorMessage message={erro} />

      <div className="leads-filtros">
        <Select
          label="Status"
          options={OPCOES_STATUS}
          value={filtroStatus}
          onChange={(e) => setFiltroStatus(e.target.value as StatusLead | "")}
        />
      </div>

      {loading ? (
        <Loading />
      ) : leads.length === 0 ? (
        <EmptyState title="Nenhum lead encontrado" description="Os contatos recebidos pela landing page aparecem aqui." />
      ) : (
        <Table columns={columns} data={leads} />
      )}
    </Layout>
  );
}
