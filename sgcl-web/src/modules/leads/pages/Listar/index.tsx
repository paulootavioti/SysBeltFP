import { useEffect, useMemo, useState } from "react";

import { Layout } from "../../../../components/layout/Layout";
import { PageHeader } from "../../../../components/layout/PageHeader";
import { Select } from "../../../../components/ui/Select";
import { ErrorMessage } from "../../../../components/ui/ErrorMessage";
import { Table } from "../../../../components/ui/Table";
import { EmptyState } from "../../../../components/ui/EmptyState";
import { Loading } from "../../../../components/ui/Loading";
import { getApiErrorMessage } from "../../../../shared/utils/getApiErrorMessage";

import { LeadsService } from "../../services/LeadsService";
import { ESTAGIO_LEAD_LABEL, type EstagioLead, type Lead } from "../../types";

import "./styles.css";

const OPCOES_ESTAGIO = Object.entries(ESTAGIO_LEAD_LABEL).map(([value, label]) => ({ value, label }));

export function Leads() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [pagina, setPagina] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");

  const [filtroEstagio, setFiltroEstagio] = useState<EstagioLead | "">("");

  const filtros = useMemo(() => ({ estagio: filtroEstagio || undefined, pagina }), [filtroEstagio, pagina]);

  async function carregar() {
    try {
      setLoading(true);
      setErro("");
      const data = await LeadsService.listar(filtros);
      setLeads(data.itens);
      setTotal(data.total);
      setTotalPaginas(data.totalPaginas);
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

  const columns = [
    { header: "Nome", accessor: "nome" as const },
    { header: "WhatsApp", accessor: "telefoneE164" as const, render: (lead: Lead) => `+${lead.telefoneE164}` },
    { header: "Interesse", accessor: "modalidadeInteresse" as const, render: (lead: Lead) => lead.modalidadeInteresse?.nome ?? "Não informado" },
    { header: "Canal", accessor: "canal" as const, render: (lead: Lead) => lead.canal.nome },
    {
      header: "Estágio",
      accessor: "estagio" as const,
      render: (lead: Lead) => ESTAGIO_LEAD_LABEL[lead.estagio],
    },
    {
      header: "Recebido em",
      accessor: "criadoEm" as const,
      render: (lead: Lead) => new Date(lead.criadoEm).toLocaleDateString("pt-BR"),
    },
  ];

  return (
    <Layout>
      <PageHeader title="Leads" subtitle="Contatos captados pelos canais comerciais da unidade." />

      <ErrorMessage message={erro} />

      <div className="leads-filtros">
        <Select
          label="Estágio"
          options={OPCOES_ESTAGIO}
          value={filtroEstagio}
          onChange={(e) => { setFiltroEstagio(e.target.value as EstagioLead | ""); setPagina(1); }}
        />
      </div>

      {loading ? (
        <Loading />
      ) : leads.length === 0 ? (
        <EmptyState title="Nenhum lead encontrado" description="Os contatos recebidos pela landing page aparecem aqui." />
      ) : (
        <Table columns={columns} data={leads} pagination={{ paginaAtual: pagina, totalPaginas, totalItens: total, itensPorPagina: 25, onChangePagina: setPagina }} />
      )}
    </Layout>
  );
}
