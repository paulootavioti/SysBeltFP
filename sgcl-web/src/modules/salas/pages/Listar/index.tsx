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
import { useSalas } from "../../hooks/useSalas";
import { SalaService } from "../../services/SalaService";
import { SalaForm } from "../../components/SalaForm";
import { getApiErrorMessage } from "../../../../shared/utils/getApiErrorMessage";
import type { Sala } from "../../types/sala";
import type { SalaFormData } from "../../schema/sala.schema";
import "./styles.css";

export function Salas() {
  const toast = useToast();
  const { salas, loading, erro, setErro, carregarSalas } = useSalas();
  const [modalAberto, setModalAberto] = useState(false);
  const [salaEditando, setSalaEditando] = useState<Sala | null>(null);
  const [salvando, setSalvando] = useState(false);

  function handleNovaSala() {
    setSalaEditando(null);
    setModalAberto(true);
  }

  function handleEditarSala(sala: Sala) {
    setSalaEditando(sala);
    setModalAberto(true);
  }

  async function handleSalvarSala(data: SalaFormData) {
    try {
      setSalvando(true);
      setErro("");

      if (salaEditando) {
        await SalaService.editar(salaEditando.id, data);
        toast.success("Sala atualizada com sucesso.");
      } else {
        await SalaService.criar(data);
        toast.success("Sala cadastrada com sucesso.");
      }

      await carregarSalas();
      setModalAberto(false);
    } catch (error) {
      const mensagem = getApiErrorMessage(error, "Erro ao salvar sala.");
      setErro(mensagem);
      toast.error(mensagem);
    } finally {
      setSalvando(false);
    }
  }

  async function handleAlterarStatus(id: number) {
    try {
      setErro("");
      await SalaService.alterarStatus(id);
      await carregarSalas();
    } catch (error) {
      setErro(getApiErrorMessage(error, "Erro ao alterar status da sala."));
    }
  }

  const columns = [
    { header: "Nome", accessor: "nome" as const },
    {
      header: "Status",
      accessor: "ativo" as const,
      render: (sala: Sala) => <StatusBadge status={sala.ativo ? "ATIVO" : "INATIVO"} />,
    },
    {
      header: "Ações",
      accessor: "id" as const,
      render: (sala: Sala) => (
        <div className="salas-table-actions">
          <Button type="button" size="sm" variant="secondary" onClick={() => handleEditarSala(sala)}>
            Editar
          </Button>
          <Button
            type="button"
            size="sm"
            variant={sala.ativo ? "danger" : "primary"}
            onClick={() => handleAlterarStatus(sala.id)}
          >
            {sala.ativo ? "Inativar" : "Ativar"}
          </Button>
        </div>
      ),
    },
  ];

  return (
    <Layout>
      <PageHeader title="Salas" subtitle="Tatames, arenas e salas disponíveis para as turmas." />

      <div className="salas-acoes">
        <Button type="button" onClick={handleNovaSala}>
          + Nova Sala
        </Button>
      </div>

      <ErrorMessage message={erro} />

      {loading ? (
        <Loading />
      ) : salas.length === 0 ? (
        <EmptyState title="Nenhuma sala cadastrada" description="Cadastre a primeira sala ou tatame." />
      ) : (
        <Table columns={columns} data={salas} />
      )}

      <Modal
        open={modalAberto}
        title={salaEditando ? "Editar Sala" : "Nova Sala"}
        onClose={() => setModalAberto(false)}
      >
        <SalaForm
          key={salaEditando?.id ?? "nova-sala"}
          sala={salaEditando ?? undefined}
          loading={salvando}
          onSubmit={handleSalvarSala}
        />
      </Modal>
    </Layout>
  );
}
