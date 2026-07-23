import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { Layout } from "../../../../components/layout/Layout";
import { PageHeader } from "../../../../components/layout/PageHeader";
import { Button } from "../../../../components/ui/Button";
import { ErrorMessage } from "../../../../components/ui/ErrorMessage";
import { Table } from "../../../../components/ui/Table";
import { EmptyState } from "../../../../components/ui/EmptyState";
import { Loading } from "../../../../components/ui/Loading";
import { Badge } from "../../../../components/ui/Badge";
import { Modal } from "../../../../components/ui/Modal";

import { useAuth } from "../../../../contexts/useAuth";
import { AulaService } from "../../services/AulaService";
import { ProgramarAulaForm, type ProgramarAulaFormData } from "../../components/ProgramarAulaForm";
import { GradeHorariaSemanal } from "../../components/GradeHorariaSemanal";
import { getApiErrorMessage } from "../../../../shared/utils/getApiErrorMessage";
import type { AulaProgramada } from "../../types";

import "./styles.css";

function formatarDataHora(data: string) {
  return new Date(data).toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

export function ProgramacaoAulas() {
  const navigate = useNavigate();
  const { usuario } = useAuth();

  const [programacoes, setProgramacoes] = useState<AulaProgramada[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");
  const [modalAberto, setModalAberto] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [iniciandoId, setIniciandoId] = useState<number | null>(null);
  const [excluindoId, setExcluindoId] = useState<number | null>(null);

  const ehAdmin = usuario?.perfil === "ADMIN";

  async function carregarProgramacoes() {
    try {
      setLoading(true);
      setErro("");
      const data = await AulaService.listarProgramadas();
      setProgramacoes(data);
    } catch (error) {
      setErro(getApiErrorMessage(error, "Erro ao carregar programação."));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregarProgramacoes();
  }, []);

  async function handleProgramar(data: ProgramarAulaFormData) {
    try {
      setSalvando(true);
      setErro("");
      await AulaService.criarProgramada({
        turmaId: Number(data.turmaId),
        aulaCurriculoId: data.aulaCurriculoId ? Number(data.aulaCurriculoId) : undefined,
        data: data.data,
        observacoes: data.observacoes || undefined,
      });
      await carregarProgramacoes();
      setModalAberto(false);
    } catch (error) {
      setErro(getApiErrorMessage(error, "Erro ao programar aula."));
    } finally {
      setSalvando(false);
    }
  }

  async function handleIniciar(id: number) {
    try {
      setIniciandoId(id);
      setErro("");
      const aula = await AulaService.iniciarProgramada(id);
      navigate(`/aulas/${aula.id}/chamada`);
    } catch (error) {
      setErro(getApiErrorMessage(error, "Erro ao iniciar aula programada."));
      setIniciandoId(null);
    }
  }

  async function handleExcluir(programacao: AulaProgramada) {
    if (!window.confirm("Excluir esta programação de aula? Essa ação não pode ser desfeita.")) {
      return;
    }

    try {
      setExcluindoId(programacao.id);
      setErro("");
      await AulaService.excluirProgramada(programacao.id);
      await carregarProgramacoes();
    } catch (error) {
      setErro(getApiErrorMessage(error, "Erro ao excluir programação."));
    } finally {
      setExcluindoId(null);
    }
  }

  const columns = [
    { header: "Turma", accessor: "turma" as const, render: (p: AulaProgramada) => p.turma.nome },
    { header: "Data/Horário", accessor: "data" as const, render: (p: AulaProgramada) => formatarDataHora(p.data) },
    {
      header: "Plano de Aula",
      accessor: "aulaCurriculoId" as const,
      render: (p: AulaProgramada) => p.aulaCurriculo?.titulo ?? "-",
    },
    {
      header: "Status",
      accessor: "status" as const,
      render: (p: AulaProgramada) => {
        if (p.status === "INICIADA") return <Badge variant="success">Iniciada</Badge>;
        if (p.status === "CANCELADA") return <Badge variant="danger">Cancelada</Badge>;
        return <Badge variant="warning">Pendente</Badge>;
      },
    },
    {
      header: "Ações",
      accessor: "id" as const,
      render: (p: AulaProgramada) => (
        <div className="programacao-acoes-linha">
          {p.status === "PENDENTE" && (
            <Button type="button" size="sm" onClick={() => handleIniciar(p.id)} disabled={iniciandoId === p.id}>
              {iniciandoId === p.id ? "Iniciando..." : "Iniciar Aula"}
            </Button>
          )}

          {ehAdmin && (
            <Button
              type="button"
              size="sm"
              variant="danger"
              disabled={excluindoId === p.id}
              onClick={() => handleExcluir(p)}
            >
              {excluindoId === p.id ? "Excluindo..." : "Excluir"}
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <Layout>
      <PageHeader title="Programação de Aulas" subtitle="Agenda prévia das próximas aulas por turma." />

      <div className="programacao-grade-semanal">
        <GradeHorariaSemanal />
      </div>

      <div className="programacao-acoes">
        <Button type="button" onClick={() => setModalAberto(true)}>
          + Programar Aula
        </Button>
      </div>

      <ErrorMessage message={erro} />

      {loading ? (
        <Loading />
      ) : programacoes.length === 0 ? (
        <EmptyState title="Nenhuma aula programada" description="Programe a próxima aula de uma turma." />
      ) : (
        <Table columns={columns} data={programacoes} />
      )}

      <Modal open={modalAberto} title="Programar Aula" onClose={() => setModalAberto(false)}>
        <ProgramarAulaForm loading={salvando} onSubmit={handleProgramar} />
      </Modal>
    </Layout>
  );
}