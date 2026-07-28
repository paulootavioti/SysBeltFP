import { useEffect, useState } from "react";

import { Layout } from "../../../../components/layout/Layout";
import { PageHeader } from "../../../../components/layout/PageHeader";
import { Loading } from "../../../../components/ui/Loading";
import { ErrorMessage } from "../../../../components/ui/ErrorMessage";
import { EmptyState } from "../../../../components/ui/EmptyState";
import { DashboardGoals } from "../../../dashboard/components/DashboardGoals";

import { MetaService } from "../../services/MetaService";
import { getApiErrorMessage } from "../../../../shared/utils/getApiErrorMessage";
import type { MetaDashboard } from "../../types";

import "./styles.css";

export function Metas() {
  const [metas, setMetas] = useState<MetaDashboard[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    let ativo = true;

    MetaService.listar()
      .then((dados) => {
        if (ativo) setMetas(dados);
      })
      .catch((error) => {
        if (ativo) setErro(getApiErrorMessage(error, "Erro ao carregar as metas."));
      })
      .finally(() => {
        if (ativo) setCarregando(false);
      });

    return () => {
      ativo = false;
    };
  }, []);

  return (
    <Layout>
      <PageHeader
        title="Metas"
        subtitle="Objetivos estratégicos de desempenho da academia."
      />

      <ErrorMessage message={erro} />

      {carregando ? (
        <Loading />
      ) : metas.length === 0 ? (
        <EmptyState title="Nenhuma meta cadastrada" description="Cadastre metas de desempenho pra acompanhar aqui." />
      ) : (
        <DashboardGoals metas={metas} mostrarBotaoGerenciar={false} />
      )}
    </Layout>
  );
}
