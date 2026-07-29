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
import { useFormasPagamento } from "../../hooks/useFormasPagamento";
import { FormaPagamentoService } from "../../services/FormaPagamentoService";
import { FormaPagamentoForm } from "../../components/FormaPagamentoForm";
import { getApiErrorMessage } from "../../../../shared/utils/getApiErrorMessage";
import { nomeFormaPagamento, type FormaPagamento } from "../../types";
import type { FormaPagamentoFormData } from "../../schema/formaPagamento.schema";
import "./styles.css";

export function FormasPagamento() {
  const toast = useToast();
  const { formasPagamento, loading, erro, setErro, carregarFormasPagamento } = useFormasPagamento();
  const [modalAberto, setModalAberto] = useState(false);
  const [formaEditando, setFormaEditando] = useState<FormaPagamento | null>(null);
  const [salvando, setSalvando] = useState(false);

  function handleNovaForma() {
    setFormaEditando(null);
    setModalAberto(true);
  }

  function handleEditarForma(forma: FormaPagamento) {
    setFormaEditando(forma);
    setModalAberto(true);
  }

  async function handleSalvarForma(data: FormaPagamentoFormData) {
    try {
      setSalvando(true);
      setErro("");

      if (formaEditando) {
        await FormaPagamentoService.editar(formaEditando.id, data);
        toast.success("Forma de pagamento atualizada com sucesso.");
      } else {
        await FormaPagamentoService.criar(data);
        toast.success("Forma de pagamento cadastrada com sucesso.");
      }

      await carregarFormasPagamento();
      setModalAberto(false);
    } catch (error) {
      const mensagem = getApiErrorMessage(error, "Erro ao salvar forma de pagamento.");
      setErro(mensagem);
      toast.error(mensagem);
    } finally {
      setSalvando(false);
    }
  }

  async function handleAlterarStatus(id: number) {
    try {
      setErro("");
      await FormaPagamentoService.alterarStatus(id);
      await carregarFormasPagamento();
    } catch (error) {
      setErro(getApiErrorMessage(error, "Erro ao alterar status da forma de pagamento."));
    }
  }

  const columns = [
    {
      header: "Forma de Pagamento",
      accessor: "tipo" as const,
      render: (forma: FormaPagamento) => nomeFormaPagamento(forma),
    },
    {
      header: "Status",
      accessor: "ativo" as const,
      render: (forma: FormaPagamento) => <StatusBadge status={forma.ativo ? "ATIVO" : "INATIVO"} />,
    },
    {
      header: "Ações",
      accessor: "id" as const,
      render: (forma: FormaPagamento) => (
        <div className="formas-pagamento-table-actions">
          <Button type="button" size="sm" variant="secondary" onClick={() => handleEditarForma(forma)}>
            Editar
          </Button>
          <Button
            type="button"
            size="sm"
            variant={forma.ativo ? "danger" : "primary"}
            onClick={() => handleAlterarStatus(forma.id)}
          >
            {forma.ativo ? "Inativar" : "Ativar"}
          </Button>
        </div>
      ),
    },
  ];

  return (
    <Layout>
      <PageHeader
        title="Formas de Pagamento"
        subtitle="Formas de pagamento habilitadas para cobranças e mensalidades da academia."
      />

      <div className="formas-pagamento-acoes">
        <Button type="button" onClick={handleNovaForma}>
          + Nova Forma de Pagamento
        </Button>
      </div>

      <ErrorMessage message={erro} />

      {loading ? (
        <Loading />
      ) : formasPagamento.length === 0 ? (
        <EmptyState
          title="Nenhuma forma de pagamento cadastrada"
          description="Cadastre as formas de pagamento aceitas pela academia."
        />
      ) : (
        <Table columns={columns} data={formasPagamento} />
      )}

      <Modal
        open={modalAberto}
        title={formaEditando ? "Editar Forma de Pagamento" : "Nova Forma de Pagamento"}
        onClose={() => setModalAberto(false)}
      >
        <FormaPagamentoForm
          key={formaEditando?.id ?? "nova-forma-pagamento"}
          formaPagamento={formaEditando ?? undefined}
          loading={salvando}
          onSubmit={handleSalvarForma}
        />
      </Modal>
    </Layout>
  );
}
