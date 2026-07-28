import { useState } from "react";

import { Layout } from "../../../../components/layout/Layout";
import { PageHeader } from "../../../../components/layout/PageHeader";
import { Button } from "../../../../components/ui/Button";
import { Loading } from "../../../../components/ui/Loading";
import { ErrorMessage } from "../../../../components/ui/ErrorMessage";
import { EmptyState } from "../../../../components/ui/EmptyState";
import { Modal } from "../../../../components/ui/Modal";
import { DashboardGoals } from "../../../dashboard/components/DashboardGoals";

import { useMetas } from "../../hooks/useMetas";
import { MetaService } from "../../services/MetaService";
import { MetaForm } from "../../components/MetaForm";
import { getApiErrorMessage } from "../../../../shared/utils/getApiErrorMessage";
import type { MetaDashboard } from "../../types";
import type { MetaFormData } from "../../schema/meta.schema";

import "./styles.css";

export function Metas() {
  const { metas, carregando, erro, setErro, carregarMetas } = useMetas();

  const [modalAberto, setModalAberto] = useState(false);
  const [metaEmEdicao, setMetaEmEdicao] = useState<MetaDashboard | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [excluindoId, setExcluindoId] = useState<number | null>(null);

  function abrirCriacao() {
    setMetaEmEdicao(null);
    setModalAberto(true);
  }

  function abrirEdicao(meta: MetaDashboard) {
    setMetaEmEdicao(meta);
    setModalAberto(true);
  }

  async function handleSalvar(data: MetaFormData) {
    try {
      setSalvando(true);
      setErro("");

      if (metaEmEdicao) {
        await MetaService.atualizar(metaEmEdicao.id, data);
      } else {
        await MetaService.criar(data);
      }

      setModalAberto(false);
      await carregarMetas();
    } catch (error) {
      setErro(getApiErrorMessage(error, "Erro ao salvar a meta."));
    } finally {
      setSalvando(false);
    }
  }

  async function handleExcluir(meta: MetaDashboard) {
    if (!window.confirm(`Excluir a meta "${meta.nome}"? Essa ação não pode ser desfeita.`)) {
      return;
    }

    try {
      setExcluindoId(meta.id);
      setErro("");
      await MetaService.excluir(meta.id);
      await carregarMetas();
    } catch (error) {
      setErro(getApiErrorMessage(error, "Erro ao excluir a meta."));
    } finally {
      setExcluindoId(null);
    }
  }

  return (
    <Layout>
      <PageHeader title="Metas" subtitle="Objetivos estratégicos de desempenho da academia." />

      <div className="metas-acoes">
        <Button type="button" onClick={abrirCriacao}>
          + Nova Meta
        </Button>
      </div>

      <ErrorMessage message={erro} />

      {carregando ? (
        <Loading />
      ) : metas.length === 0 ? (
        <EmptyState
          title="Nenhuma meta cadastrada"
          description="Cadastre metas de desempenho pra acompanhar aqui."
          action={
            <Button type="button" onClick={abrirCriacao}>
              Criar meta
            </Button>
          }
        />
      ) : (
        <DashboardGoals
          metas={metas}
          mostrarBotaoGerenciar={false}
          renderAcoes={(meta) => (
            <div className="metas-card-acoes">
              <Button type="button" variant="secondary" size="sm" onClick={() => abrirEdicao(meta)}>
                Editar
              </Button>
              <Button
                type="button"
                variant="danger"
                size="sm"
                disabled={excluindoId === meta.id}
                onClick={() => handleExcluir(meta)}
              >
                {excluindoId === meta.id ? "Excluindo..." : "Excluir"}
              </Button>
            </div>
          )}
        />
      )}

      <Modal
        open={modalAberto}
        title={metaEmEdicao ? "Editar Meta" : "Nova Meta"}
        onClose={() => setModalAberto(false)}
      >
        <MetaForm loading={salvando} valoresIniciais={metaEmEdicao ?? undefined} onSubmit={handleSalvar} />
      </Modal>
    </Layout>
  );
}
