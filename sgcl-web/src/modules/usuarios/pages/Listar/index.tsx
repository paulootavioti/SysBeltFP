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
import { Tooltip } from "../../../../components/ui/Tooltip";
import { useUsuarios } from "../../hooks/useUsuarios";
import { UsuarioService } from "../../services/UsuarioService";
import { getApiErrorMessage } from "../../../../shared/utils/getApiErrorMessage";
import { UsuarioForm } from "../../components/UsuarioForm";
import type { Usuario } from "../../types/usuario";
import type { UsuarioUpdateFormData } from "../../schema/usuario.schema";
import "./styles.css";
export function Usuarios() {
  const { usuarios, loading, erro, setErro, carregarUsuarios } = useUsuarios();
  const [modalAberto, setModalAberto] = useState(false);
  const [usuarioEditando, setUsuarioEditando] = useState<Usuario | null>(null);
  const [salvando, setSalvando] = useState(false);

  function fecharModal() {
    setModalAberto(false);
    setUsuarioEditando(null);
  }

  async function handleCriarUsuario(data: UsuarioUpdateFormData) {
    try {
      setSalvando(true);
      setErro("");
      await UsuarioService.criar(data);
      await carregarUsuarios();
      fecharModal();
    } catch (error) {
      setErro(getApiErrorMessage(error, "Erro ao cadastrar usuário."));
    } finally {
      setSalvando(false);
    }
  }
  async function handleEditarUsuario(data: UsuarioUpdateFormData) {
    if (!usuarioEditando) return;
    try {
      setSalvando(true);
      setErro("");
      await UsuarioService.atualizar(usuarioEditando.id, data);
      await carregarUsuarios();
      fecharModal();
    } catch (error) {
      setErro(getApiErrorMessage(error, "Erro ao atualizar usuário."));
    } finally {
      setSalvando(false);
    }
  }
  async function handleAlterarPerfil(id: number, perfil: string) {
    try {
      setErro("");
      await UsuarioService.atualizarPerfil(id, perfil);
      await carregarUsuarios();
    } catch (error) {
      setErro(getApiErrorMessage(error, "Erro ao alterar perfil."));
    }
  }
  async function handleAlterarStatus(id: number) {
    try {
      setErro("");
      await UsuarioService.alterarStatus(id);
      await carregarUsuarios();
    } catch (error) {
      setErro(getApiErrorMessage(error, "Erro ao alterar status do usuário."));
    }
  }
  const columns = [
    {
      header: "Nome",
      accessor: "nome" as const,
      render: (usuario: Usuario) => (
        <Tooltip
          content={
            <>
              <div>Apelido: {usuario.apelido || "-"}</div>
              {usuario.nivelGraduacao && <div>Graduação: {usuario.nivelGraduacao}</div>}
            </>
          }
        >
          {usuario.nome}
        </Tooltip>
      ),
    },
    { header: "Email", accessor: "email" as const },
    {
      header: "Perfil",
      accessor: "perfil" as const,
      render: (usuario: Usuario) => (
        <select
          value={usuario.perfil}
          onChange={(e) => handleAlterarPerfil(usuario.id, e.target.value)}
          className="usuarios-perfil-select"
        >
          <option value="ADMIN">Admin</option>
          <option value="PROFESSOR">Professor</option>
          <option value="RECEPCAO">Recepção</option>
        </select>
      ),
    },
    {
      header: "Status",
      accessor: "ativo" as const,
      render: (usuario: Usuario) => (
        <StatusBadge status={usuario.ativo ? "ATIVO" : "INATIVO"} />
      ),
    },
    {
      header: "Ações",
      accessor: "id" as const,
      render: (usuario: Usuario) => (
        <div className="usuarios-table-actions">
          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={() => setUsuarioEditando(usuario)}
          >
            Editar
          </Button>

          <Button
            type="button"
            size="sm"
            variant={usuario.ativo ? "danger" : "primary"}
            onClick={() => handleAlterarStatus(usuario.id)}
          >
            {usuario.ativo ? "Inativar" : "Ativar"}
          </Button>
        </div>
      ),
    },
  ];
  return (
    <Layout>
      <PageHeader title="Usuários" subtitle="Gestão de usuários do sistema." />
      <div className="usuarios-acoes">
        <Button type="button" onClick={() => setModalAberto(true)}>
          + Novo Usuário
        </Button>
      </div>
      <ErrorMessage message={erro} />
      {loading ? (
        <Loading />
      ) : usuarios.length === 0 ? (
        <EmptyState
          title="Nenhum usuário cadastrado"
          description="Cadastre o primeiro usuário do sistema."
        />
      ) : (
        <Table columns={columns} data={usuarios} />
      )}
      <Modal
        open={modalAberto}
        title="Novo Usuário"
        onClose={fecharModal}
      >
        <UsuarioForm loading={salvando} onSubmit={handleCriarUsuario} />
      </Modal>

      <Modal
        open={usuarioEditando !== null}
        title="Editar Usuário"
        onClose={fecharModal}
      >
        {usuarioEditando && (
          <UsuarioForm
            usuario={usuarioEditando}
            loading={salvando}
            onSubmit={handleEditarUsuario}
          />
        )}
      </Modal>
    </Layout>
  );
}