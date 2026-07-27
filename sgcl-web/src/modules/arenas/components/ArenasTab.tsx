import { useState } from "react";
import { Button } from "../../../components/ui/Button";
import { ErrorMessage } from "../../../components/ui/ErrorMessage";
import { Table } from "../../../components/ui/Table";
import { EmptyState } from "../../../components/ui/EmptyState";
import { Loading } from "../../../components/ui/Loading";
import { StatusBadge } from "../../../components/ui/StatusBadge";
import { Modal } from "../../../components/ui/Modal";
import { useToast } from "../../../contexts/toast/useToast";
import { useAuth } from "../../../contexts/useAuth";
import { useArenas } from "../hooks/useArenas";
import { ArenaService } from "../services/ArenaService";
import { ArenaForm } from "./ArenaForm";
import { getApiErrorMessage } from "../../../shared/utils/getApiErrorMessage";
import type { Arena } from "../types/arena";
import type { ArenaFormData } from "../schema/arena.schema";
import "./ArenasTab.css";

export function ArenasTab() {
  const toast = useToast();
  const { usuario } = useAuth();
  const ehSuperadmin = usuario?.perfil === "SUPERADMIN";
  const { arenas, loading, erro, setErro, carregarArenas } = useArenas();
  const [modalAberto, setModalAberto] = useState(false);
  const [arenaEditando, setArenaEditando] = useState<Arena | null>(null);
  const [salvando, setSalvando] = useState(false);

  function handleNovaArena() {
    setArenaEditando(null);
    setModalAberto(true);
  }

  function handleEditarArena(arena: Arena) {
    setArenaEditando(arena);
    setModalAberto(true);
  }

  async function handleSalvarArena(data: ArenaFormData) {
    try {
      setSalvando(true);
      setErro("");

      if (arenaEditando) {
        await ArenaService.editar(arenaEditando.id, data);
        toast.success("Arena atualizada com sucesso.");
      } else {
        await ArenaService.criar(data);
        toast.success("Arena cadastrada com sucesso.");
      }

      await carregarArenas();
      setModalAberto(false);
    } catch (error) {
      const mensagem = getApiErrorMessage(error, "Erro ao salvar arena.");
      setErro(mensagem);
      toast.error(mensagem);
    } finally {
      setSalvando(false);
    }
  }

  async function handleAlterarStatus(id: number) {
    try {
      setErro("");
      await ArenaService.alterarStatus(id);
      await carregarArenas();
    } catch (error) {
      setErro(getApiErrorMessage(error, "Erro ao alterar status da arena."));
    }
  }

  const columns = [
    { header: "Nome", accessor: "nome" as const },
    ...(ehSuperadmin
      ? [
          {
            header: "Unidade",
            accessor: "unidade" as const,
            render: (arena: Arena) => arena.unidade?.nome || "-",
          },
        ]
      : []),
    {
      header: "Status",
      accessor: "ativo" as const,
      render: (arena: Arena) => <StatusBadge status={arena.ativo ? "ATIVO" : "INATIVO"} />,
    },
    {
      header: "Ações",
      accessor: "id" as const,
      render: (arena: Arena) => (
        <div className="arenas-table-actions">
          <Button type="button" size="sm" variant="secondary" onClick={() => handleEditarArena(arena)}>
            Editar
          </Button>
          <Button
            type="button"
            size="sm"
            variant={arena.ativo ? "danger" : "primary"}
            onClick={() => handleAlterarStatus(arena.id)}
          >
            {arena.ativo ? "Inativar" : "Ativar"}
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="arenas-tab">
      <div className="arenas-acoes">
        <Button type="button" onClick={handleNovaArena}>
          + Nova Arena
        </Button>
      </div>

      <ErrorMessage message={erro} />

      {loading ? (
        <Loading />
      ) : arenas.length === 0 ? (
        <EmptyState title="Nenhuma arena cadastrada" description="Cadastre a primeira arena ou tatame." />
      ) : (
        <Table columns={columns} data={arenas} />
      )}

      <Modal
        open={modalAberto}
        title={arenaEditando ? "Editar Arena" : "Nova Arena"}
        onClose={() => setModalAberto(false)}
      >
        <ArenaForm
          key={arenaEditando?.id ?? "nova-arena"}
          arena={arenaEditando ?? undefined}
          loading={salvando}
          onSubmit={handleSalvarArena}
        />
      </Modal>
    </div>
  );
}
