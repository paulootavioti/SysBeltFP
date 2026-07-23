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
import { usePlanos } from "../../hooks/usePlanos";
import { PlanoService } from "../../services/PlanoService";
import { PlanoForm } from "../../components/PlanoForm";
import { getApiErrorMessage } from "../../../../shared/utils/getApiErrorMessage";
import type { Plano } from "../../types/plano";
import type { PlanoFormData } from "../../schema/plano.schema";
import "./styles.css";

export function Planos() {
  const toast = useToast();
  const { planos, loading, erro, setErro, carregarPlanos } = usePlanos();
  const [modalAberto, setModalAberto] = useState(false);
  const [planoEditando, setPlanoEditando] = useState<Plano | null>(null);
  const [salvando, setSalvando] = useState(false);

  function handleNovoPlano() {
    setPlanoEditando(null);
    setModalAberto(true);
  }

  function handleEditarPlano(plano: Plano) {
    setPlanoEditando(plano);
    setModalAberto(true);
  }

  async function handleSalvarPlano(data: PlanoFormData) {
    try {
      setSalvando(true);
      setErro("");

      if (planoEditando) {
        await PlanoService.editar(planoEditando.id, data);
        toast.success("Plano atualizado com sucesso.");
      } else {
        await PlanoService.criar(data);
        toast.success("Plano cadastrado com sucesso.");
      }

      await carregarPlanos();
      setModalAberto(false);
    } catch (error) {
      const mensagem = getApiErrorMessage(error, "Erro ao salvar plano.");
      setErro(mensagem);
      toast.error(mensagem);
    } finally {
      setSalvando(false);
    }
  }

  async function handleAlterarStatus(id: number) {
    try {
      setErro("");
      await PlanoService.alterarStatus(id);
      await carregarPlanos();
    } catch (error) {
      setErro(getApiErrorMessage(error, "Erro ao alterar status do plano."));
    }
  }

  const columns = [
    { header: "Nome", accessor: "nome" as const },
    {
      header: "Valor",
      accessor: "valor" as const,
      render: (plano: Plano) =>
        `R$ ${plano.valor.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    },
    { header: "Periodicidade", accessor: "periodicidade" as const },
    {
      header: "Status",
      accessor: "ativo" as const,
      render: (plano: Plano) => <StatusBadge status={plano.ativo ? "ATIVO" : "INATIVO"} />,
    },
    {
      header: "Ações",
      accessor: "id" as const,
      render: (plano: Plano) => (
        <div className="planos-table-actions">
          <Button type="button" size="sm" variant="secondary" onClick={() => handleEditarPlano(plano)}>
            Editar
          </Button>
          <Button
            type="button"
            size="sm"
            variant={plano.ativo ? "danger" : "primary"}
            onClick={() => handleAlterarStatus(plano.id)}
          >
            {plano.ativo ? "Inativar" : "Ativar"}
          </Button>
        </div>
      ),
    },
  ];

  return (
    <Layout>
      <PageHeader title="Planos" subtitle="Catálogo de planos de pagamento da academia." />

      <div className="planos-acoes">
        <Button type="button" onClick={handleNovoPlano}>
          + Novo Plano
        </Button>
      </div>

      <ErrorMessage message={erro} />

      {loading ? (
        <Loading />
      ) : planos.length === 0 ? (
        <EmptyState title="Nenhum plano cadastrado" description="Cadastre o primeiro plano de pagamento." />
      ) : (
        <Table columns={columns} data={planos} />
      )}

      <Modal
        open={modalAberto}
        title={planoEditando ? "Editar Plano" : "Novo Plano"}
        onClose={() => setModalAberto(false)}
      >
        <PlanoForm
          key={planoEditando?.id ?? "novo-plano"}
          plano={planoEditando ?? undefined}
          loading={salvando}
          onSubmit={handleSalvarPlano}
        />
      </Modal>
    </Layout>
  );
}
