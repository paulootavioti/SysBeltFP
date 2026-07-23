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
import { useToast } from "../../../../contexts/toast/useToast";
import { TurmaForm } from "../../components/TurmaForm";
import type { Turma } from "../../types/turma";
import type { TurmaFormData } from "../../schema/turma.schema";

import "./styles.css";

export function Turmas() {
  const navigate = useNavigate();
  const toast = useToast();
  const { turmas, loading, erro, setErro, carregarTurmas } = useTurmas();
  const [modalAberto, setModalAberto] = useState(false);
  const [turmaEditando, setTurmaEditando] = useState<Turma | null>(null);
  const [salvando, setSalvando] = useState(false);

  function handleNovaTurma() {
    setTurmaEditando(null);
    setModalAberto(true);
  }

  function handleEditarTurma(turma: Turma) {
    setTurmaEditando(turma);
    setModalAberto(true);
  }

  async function handleSalvarTurma(data: TurmaFormData) {
    try {
      setSalvando(true);
      setErro("");

      if (turmaEditando) {
        await TurmaService.editar(turmaEditando.id, data);
        toast.success("Turma atualizada com sucesso.");
      } else {
        await TurmaService.criar(data);
        toast.success("Turma cadastrada com sucesso.");
      }

      await carregarTurmas();
      setModalAberto(false);
    } catch (error) {
      const mensagem = getApiErrorMessage(error, "Erro ao salvar turma.");
      setErro(mensagem);
      toast.error(mensagem);
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
    {
      header: "Professor",
      accessor: "professor" as const,
      render: (turma: Turma) => turma.professor?.apelido || turma.professor?.nome || "-",
    },
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
          <Button type="button" size="sm" variant="secondary" onClick={() => navigate(`/turmas/${turma.id}`)}>
            Ver alunos
          </Button>

          <Button type="button" size="sm" variant="secondary" onClick={() => handleEditarTurma(turma)}>
            Editar
          </Button>

          <Button
            type="button"
            size="sm"
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
        <Button type="button" onClick={handleNovaTurma}>
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

      <Modal
        open={modalAberto}
        title={turmaEditando ? "Editar Turma" : "Nova Turma"}
        onClose={() => setModalAberto(false)}
      >
        <TurmaForm
          key={turmaEditando?.id ?? "nova-turma"}
          turma={turmaEditando ?? undefined}
          loading={salvando}
          onSubmit={handleSalvarTurma}
        />
      </Modal>
    </Layout>
  );
}