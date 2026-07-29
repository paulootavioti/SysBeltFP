import { useState } from "react";
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
import { useAuth } from "../../../../contexts/useAuth";

import { useModelosContrato } from "../../hooks/useModelosContrato";
import { ModeloContratoService } from "../../services/ModeloContratoService";
import { ModeloContratoForm } from "../../components/ModeloContratoForm";
import { getApiErrorMessage } from "../../../../shared/utils/getApiErrorMessage";
import type { ModeloContrato } from "../../types";
import type { ModeloContratoFormData } from "../../schema/modeloContrato.schema";

import "./styles.css";

export function ModelosContrato() {
  const toast = useToast();
  const { usuario } = useAuth();
  const ehAdmin = usuario?.perfil === "ADMIN";
  const { modelos, loading, erro, setErro, carregarModelos } = useModelosContrato();
  const [modalAberto, setModalAberto] = useState(false);
  const [modeloEditando, setModeloEditando] = useState<ModeloContrato | null>(null);
  const [salvando, setSalvando] = useState(false);

  function handleNovoModelo() {
    setModeloEditando(null);
    setModalAberto(true);
  }

  function handleEditarModelo(modelo: ModeloContrato) {
    setModeloEditando(modelo);
    setModalAberto(true);
  }

  async function handleSalvarModelo(data: ModeloContratoFormData) {
    try {
      setSalvando(true);
      setErro("");

      if (modeloEditando) {
        await ModeloContratoService.editar(modeloEditando.id, data);
        toast.success("Modelo atualizado com sucesso.");
      } else {
        await ModeloContratoService.criar(data);
        toast.success("Modelo cadastrado com sucesso.");
      }

      await carregarModelos();
      setModalAberto(false);
    } catch (error) {
      const mensagem = getApiErrorMessage(error, "Erro ao salvar modelo de contrato.");
      setErro(mensagem);
      toast.error(mensagem);
    } finally {
      setSalvando(false);
    }
  }

  async function handleAlternarAtivo(modelo: ModeloContrato) {
    try {
      setErro("");
      await ModeloContratoService.alternarAtivo(modelo.id);
      await carregarModelos();
    } catch (error) {
      setErro(getApiErrorMessage(error, "Erro ao alterar situação do modelo."));
    }
  }

  async function handleVersionar(modelo: ModeloContrato) {
    try {
      setErro("");
      await ModeloContratoService.versionar(modelo.id);
      toast.success("Nova versão criada a partir deste modelo.");
      await carregarModelos();
    } catch (error) {
      const mensagem = getApiErrorMessage(error, "Erro ao criar nova versão do modelo.");
      setErro(mensagem);
      toast.error(mensagem);
    }
  }

  async function handleClonar(modelo: ModeloContrato) {
    try {
      setErro("");
      await ModeloContratoService.clonar(modelo.id);
      toast.success("Modelo clonado com sucesso.");
      await carregarModelos();
    } catch (error) {
      const mensagem = getApiErrorMessage(error, "Erro ao clonar modelo.");
      setErro(mensagem);
      toast.error(mensagem);
    }
  }

  const columns = [
    { header: "Nome", accessor: "nome" as const },
    { header: "Versão", accessor: "versao" as const },
    {
      header: "Situação",
      accessor: "ativo" as const,
      render: (m: ModeloContrato) => <Badge variant={m.ativo ? "success" : "neutral"}>{m.ativo ? "Ativo" : "Inativo"}</Badge>,
    },
    {
      header: "Ações",
      accessor: "id" as const,
      render: (m: ModeloContrato) => (
        <div className="modelos-contrato-table-actions">
          <Button type="button" size="sm" variant="secondary" onClick={() => handleEditarModelo(m)}>
            Editar
          </Button>
          {ehAdmin && (
            <Button type="button" size="sm" variant="secondary" onClick={() => handleVersionar(m)}>
              Nova versão
            </Button>
          )}
          {ehAdmin && (
            <Button type="button" size="sm" variant="secondary" onClick={() => handleClonar(m)}>
              Clonar
            </Button>
          )}
          {ehAdmin && (
            <Button type="button" size="sm" variant={m.ativo ? "danger" : "secondary"} onClick={() => handleAlternarAtivo(m)}>
              {m.ativo ? "Inativar" : "Ativar"}
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <Layout>
      <PageHeader title="Modelos de Contrato" subtitle="Textos-base usados na geração de contratos." />

      <div className="modelos-contrato-acoes">
        <Button type="button" onClick={handleNovoModelo}>
          + Novo Modelo
        </Button>
      </div>

      <ErrorMessage message={erro} />

      {loading ? (
        <Loading />
      ) : modelos.length === 0 ? (
        <EmptyState
          title="Nenhum modelo de contrato cadastrado"
          description="Cadastre um modelo para começar a gerar contratos."
          action={
            <Button type="button" onClick={handleNovoModelo}>
              Criar modelo
            </Button>
          }
        />
      ) : (
        <Table columns={columns} data={modelos} />
      )}

      <Modal
        open={modalAberto}
        title={modeloEditando ? "Editar Modelo de Contrato" : "Novo Modelo de Contrato"}
        onClose={() => setModalAberto(false)}
      >
        <ModeloContratoForm
          key={modeloEditando?.id ?? "novo-modelo-contrato"}
          modelo={modeloEditando ?? undefined}
          loading={salvando}
          onSubmit={handleSalvarModelo}
        />
      </Modal>
    </Layout>
  );
}
