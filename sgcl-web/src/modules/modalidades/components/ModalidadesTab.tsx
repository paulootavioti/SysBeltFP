import { useState } from "react";

import { Button } from "../../../components/ui/Button";
import { ErrorMessage } from "../../../components/ui/ErrorMessage";
import { Table } from "../../../components/ui/Table";
import { EmptyState } from "../../../components/ui/EmptyState";
import { Loading } from "../../../components/ui/Loading";
import { StatusBadge } from "../../../components/ui/StatusBadge";
import { Badge } from "../../../components/ui/Badge";
import { Modal } from "../../../components/ui/Modal";
import { useToast } from "../../../contexts/toast/useToast";
import { getApiErrorMessage } from "../../../shared/utils/getApiErrorMessage";

import { useModalidades } from "../hooks/useModalidades";
import { ModalidadeService } from "../services/ModalidadeService";
import { ModalidadeForm } from "./ModalidadeForm";
import type { Modalidade } from "../types/modalidade";
import type { ModalidadeFormData } from "../schema/modalidade.schema";
import "./ModalidadesTab.css";

export function ModalidadesTab() {
  const toast = useToast();
  const { modalidades, loading, erro, setErro, carregarModalidades } = useModalidades();
  const [modalAberto, setModalAberto] = useState(false);
  const [editando, setEditando] = useState<Modalidade | null>(null);
  const [salvando, setSalvando] = useState(false);

  function handleNova() {
    setEditando(null);
    setModalAberto(true);
  }

  async function handleSalvar(data: ModalidadeFormData) {
    try {
      setSalvando(true);
      setErro("");

      if (editando) {
        await ModalidadeService.editar(editando.id, data);
        toast.success("Modalidade atualizada com sucesso.");
      } else {
        await ModalidadeService.criar(data);
        toast.success("Modalidade cadastrada com sucesso.");
      }

      await carregarModalidades();
      setModalAberto(false);
    } catch (error) {
      const mensagem = getApiErrorMessage(error, "Erro ao salvar modalidade.");
      setErro(mensagem);
      toast.error(mensagem);
    } finally {
      setSalvando(false);
    }
  }

  async function handleAlterarStatus(modalidade: Modalidade) {
    try {
      setErro("");
      await ModalidadeService.alterarStatus(modalidade.id);
      await carregarModalidades();
    } catch (error) {
      // o backend recusa inativar modalidade com turma ativa e explica o
      // motivo — vale mostrar o texto dele, não uma mensagem genérica.
      const mensagem = getApiErrorMessage(error, "Erro ao alterar status da modalidade.");
      setErro(mensagem);
      toast.error(mensagem);
    }
  }

  const columns = [
    { header: "Nome", accessor: "nome" as const },
    {
      header: "Público",
      accessor: "publicoAlvo" as const,
      render: (m: Modalidade) =>
        m.publicoAlvo || <span className="modalidades-vazio">Não informado</span>,
    },
    {
      header: "Coordenador",
      accessor: "coordenador" as const,
      render: (m: Modalidade) =>
        m.coordenador?.nome || <span className="modalidades-vazio">Sem coordenador</span>,
    },
    {
      header: "Turmas",
      accessor: "_count" as const,
      render: (m: Modalidade) => m._count?.turmas ?? 0,
    },
    {
      header: "No site",
      accessor: "visivelNaLanding" as const,
      render: (m: Modalidade) =>
        m.visivelNaLanding ? (
          <Badge variant="success">Visível</Badge>
        ) : (
          <Badge variant="neutral">Oculta</Badge>
        ),
    },
    {
      header: "Status",
      accessor: "ativo" as const,
      render: (m: Modalidade) => <StatusBadge status={m.ativo ? "ATIVO" : "INATIVO"} />,
    },
    {
      header: "Ações",
      accessor: "id" as const,
      render: (m: Modalidade) => (
        <div className="modalidades-table-actions">
          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={() => {
              setEditando(m);
              setModalAberto(true);
            }}
          >
            Editar
          </Button>
          <Button
            type="button"
            size="sm"
            variant={m.ativo ? "danger" : "primary"}
            onClick={() => handleAlterarStatus(m)}
          >
            {m.ativo ? "Inativar" : "Ativar"}
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="modalidades-tab">
      <div className="modalidades-acoes">
        <Button type="button" onClick={handleNova}>
          + Nova Modalidade
        </Button>
      </div>

      <ErrorMessage message={erro} />

      {loading ? (
        <Loading />
      ) : modalidades.length === 0 ? (
        <EmptyState
          title="Nenhuma modalidade cadastrada"
          description="Cadastre as modalidades que a academia oferece — elas organizam turmas, currículos e a vitrine do site."
        />
      ) : (
        <Table columns={columns} data={modalidades} />
      )}

      <Modal
        open={modalAberto}
        title={editando ? "Editar Modalidade" : "Nova Modalidade"}
        onClose={() => setModalAberto(false)}
      >
        <ModalidadeForm
          key={editando?.id ?? "nova-modalidade"}
          modalidade={editando ?? undefined}
          loading={salvando}
          onSubmit={handleSalvar}
        />
      </Modal>
    </div>
  );
}
