import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { Layout } from "../../../../components/layout/Layout";
import { PageHeader } from "../../../../components/layout/PageHeader";
import { Button } from "../../../../components/ui/Button";
import { ErrorMessage } from "../../../../components/ui/ErrorMessage";
import { Table } from "../../../../components/ui/Table";
import { EmptyState } from "../../../../components/ui/EmptyState";
import { Loading } from "../../../../components/ui/Loading";
import { StatusBadge } from "../../../../components/ui/StatusBadge";
import { Modal } from "../../../../components/ui/Modal";

import { useTurmas } from "../../hooks/useTurmas";
import { TurmaService } from "../../services/TurmaService";
import { getApiErrorMessage } from "../../../../shared/utils/getApiErrorMessage";
import { TurmaForm } from "../../components/TurmaForm";
import type { Turma } from "../../types/turma";
import type { TurmaFormData } from "../../schema/turma.schema";

import "./styles.css";

export function Turmas() {
  const navigate = useNavigate();
  const { turmas, loading, erro, setErro, carregarTurmas } = useTurmas();
  const [modalAberto, setModalAberto] = useState(false);
  const [salvando, setSalvando] = useState(false);

  async function handleCriarTurma(data: TurmaFormData) {
    try {
      setSalvando(true);
      setErro("");
      await TurmaService.criar(data);
      await carregarTurmas();
      setModalAberto(false);
    } catch (error) {
      setErro(getApiErrorMessage(error, "Erro ao cadastrar turma."));
    } finally {
      setSalvando(false);
    }
  }

  async function handleAlterarStatus(id: number) {
    try {
      setErro("");
      await TurmaService.alterarStatus(id);
      await carregarTurmas();
    } catch (error) {
      setErro(getApiErrorMessage(error, "Erro ao alterar status da turma."));
    }
  }

  const columns = [
    { header: "Nome", accessor: "nome" as const },
    { header: "Faixa Etária", accessor: "faixaEtaria" as const },
    { header: "Professor", accessor: "professor" as const },
    { header: "Dias", accessor: "diasSemana" as const },
    {
      header: "Horário",
      accessor: "horarioInicio" as const,
      render: (turma: Turma) => `${turma.horarioInicio} - ${turma.horarioFim}`,
    },
    {
      header: "Vagas",
      accessor: "limiteAlunos" as const,
      render: (turma: Turma) =>
        turma.limiteAlunos
          ? `${turma._count?.alunos ?? 0}/${turma.limiteAlunos}`
          : "Sem limite",
    },
    {
      header: "Status",
      accessor: "ativo" as const,
      render: (turma: Turma) => (
        <StatusBadge status={turma.ativo ? "ATIVO" : "INATIVO"} />
      ),
    },
    {
      header: "Ações",
      accessor: "id" as const,
      render: (turma: Turma) => (
        <div className="turmas-acoes-linha">
          <Button type="button" variant="secondary" onClick={() => navigate(`/turmas/${turma.id}`)}>
            Ver alunos
          </Button>

          <Button
            type="button"
            variant={turma.ativo ? "danger" : "primary"}
            onClick={() => handleAlterarStatus(turma.id)}
          >
            {turma.ativo ? "Inativar" : "Ativar"}
          </Button>
        </div>
      ),
    },
  ];

  return (
    <Layout>
      <PageHeader title="Turmas" subtitle="Gestão de turmas e horários." />

      <div className="turmas-acoes">
        <Button type="button" onClick={() => setModalAberto(true)}>
          + Nova Turma
        </Button>
      </div>

      <ErrorMessage message={erro} />

      {loading ? (
        <Loading />
      ) : turmas.length === 0 ? (
        <EmptyState title="Nenhuma turma cadastrada" description="Cadastre a primeira turma." />
      ) : (
        <Table columns={columns} data={turmas} />
      )}

      <Modal open={modalAberto} title="Nova Turma" onClose={() => setModalAberto(false)}>
        <TurmaForm loading={salvando} onSubmit={handleCriarTurma} />
      </Modal>
    </Layout>
  );
}