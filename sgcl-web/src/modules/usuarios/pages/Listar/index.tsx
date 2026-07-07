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
import { useUsuarios } from "../../hooks/useUsuarios";
import { UsuarioService } from "../../services/UsuarioService";
import { getApiErrorMessage } from "../../../../shared/utils/getApiErrorMessage";
import { UsuarioForm } from "../../components/UsuarioForm";
import type { Usuario } from "../../types/usuario";
import type { UsuarioFormData } from "../../schema/usuario.schema";
import "./styles.css";
export function Usuarios() {
  const { usuarios, loading, erro, setErro, carregarUsuarios } = useUsuarios();
  const [modalAberto, setModalAberto] = useState(false);
  const [salvando, setSalvando] = useState(false);
  async function handleCriarUsuario(data: UsuarioFormData) {
    try {
      setSalvando(true);
      setErro("");
      await UsuarioService.criar(data);
      await carregarUsuarios();
      setModalAberto(false);
    } catch (error) {
      setErro(getApiErrorMessage(error, "Erro ao cadastrar usuário."));
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
    { header: "Nome", accessor: "nome" as const },
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
        <Button
          type="button"
          variant={usuario.ativo ? "danger" : "primary"}
          onClick={() => handleAlterarStatus(usuario.id)}
        >
          {usuario.ativo ? "Inativar" : "Ativar"}
        </Button>
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
        onClose={() => setModalAberto(false)}
      >
        <UsuarioForm loading={salvando} onSubmit={handleCriarUsuario} />
      </Modal>
    </Layout>
  );
}