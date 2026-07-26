import { useState } from "react";
import { Layout } from "../../../../components/layout/Layout";
import { PageHeader } from "../../../../components/layout/PageHeader";
import { Button } from "../../../../components/ui/Button";
import { ErrorMessage } from "../../../../components/ui/ErrorMessage";
import { Table } from "../../../../components/ui/Table";
import { EmptyState } from "../../../../components/ui/EmptyState";
import { Loading } from "../../../../components/ui/Loading";
import { StatusBadge } from "../../../../components/ui/StatusBadge";
import { Modal } from "../../../../components/ui/Modal";
import { useToast } from "../../../../contexts/toast/useToast";
import { useUnidades } from "../../hooks/useUnidades";
import { UnidadeService } from "../../services/UnidadeService";
import { UnidadeForm } from "../../components/UnidadeForm";
import { getApiErrorMessage } from "../../../../shared/utils/getApiErrorMessage";
import type { Unidade } from "../../types/unidade";
import type { UnidadeFormData } from "../../schema/unidade.schema";
import "./styles.css";

export function Unidades() {
  const toast = useToast();
  const { unidades, loading, erro, setErro, carregarUnidades } = useUnidades();
  const [modalAberto, setModalAberto] = useState(false);
  const [unidadeEditando, setUnidadeEditando] = useState<Unidade | null>(null);
  const [salvando, setSalvando] = useState(false);

  function handleNovaUnidade() {
    setUnidadeEditando(null);
    setModalAberto(true);
  }

  function handleEditarUnidade(unidade: Unidade) {
    setUnidadeEditando(unidade);
    setModalAberto(true);
  }

  async function handleSalvarUnidade(data: UnidadeFormData) {
    try {
      setSalvando(true);
      setErro("");

      if (unidadeEditando) {
        await UnidadeService.editar(unidadeEditando.id, data);
        toast.success("Unidade atualizada com sucesso.");
      } else {
        await UnidadeService.criar(data);
        toast.success("Unidade cadastrada com sucesso.");
      }

      await carregarUnidades();
      setModalAberto(false);
    } catch (error) {
      const mensagem = getApiErrorMessage(error, "Erro ao salvar unidade.");
      setErro(mensagem);
      toast.error(mensagem);
    } finally {
      setSalvando(false);
    }
  }

  async function handleAlterarStatus(id: number) {
    try {
      setErro("");
      await UnidadeService.alterarStatus(id);
      await carregarUnidades();
    } catch (error) {
      setErro(getApiErrorMessage(error, "Erro ao alterar status da unidade."));
    }
  }

  const columns = [
    { header: "Nome", accessor: "nome" as const },
    {
      header: "Status",
      accessor: "ativo" as const,
      render: (unidade: Unidade) => <StatusBadge status={unidade.ativo ? "ATIVO" : "INATIVO"} />,
    },
    {
      header: "Ações",
      accessor: "id" as const,
      render: (unidade: Unidade) => (
        <div className="unidades-table-actions">
          <Button type="button" size="sm" variant="secondary" onClick={() => handleEditarUnidade(unidade)}>
            Editar
          </Button>
          <Button
            type="button"
            size="sm"
            variant={unidade.ativo ? "danger" : "primary"}
            onClick={() => handleAlterarStatus(unidade.id)}
          >
            {unidade.ativo ? "Inativar" : "Ativar"}
          </Button>
        </div>
      ),
    },
  ];

  return (
    <Layout>
      <PageHeader title="Unidades" subtitle="Academias/filiais administradas por você." />

      <div className="unidades-acoes">
        <Button type="button" onClick={handleNovaUnidade}>
          + Nova Unidade
        </Button>
      </div>

      <ErrorMessage message={erro} />

      {loading ? (
        <Loading />
      ) : unidades.length === 0 ? (
        <EmptyState title="Nenhuma unidade cadastrada" description="Cadastre a primeira unidade." />
      ) : (
        <Table columns={columns} data={unidades} />
      )}

      <Modal
        open={modalAberto}
        title={unidadeEditando ? "Editar Unidade" : "Nova Unidade"}
        onClose={() => setModalAberto(false)}
      >
        <UnidadeForm
          key={unidadeEditando?.id ?? "nova-unidade"}
          unidade={unidadeEditando ?? undefined}
          loading={salvando}
          onSubmit={handleSalvarUnidade}
        />
      </Modal>
    </Layout>
  );
}
