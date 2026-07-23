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
import { EditarProgramacaoForm, type EditarProgramacaoFormData } from "../../components/EditarProgramacaoForm";
import { ReplicarProgramacaoForm, type ReplicarProgramacaoFormData } from "../../components/ReplicarProgramacaoForm";
import { AvisoCancelamentoLista } from "../../components/AvisoCancelamentoLista";
import { GradeHorariaSemanal } from "../../components/GradeHorariaSemanal";
import { ResumoTurmas } from "../../components/ResumoTurmas";
import { getApiErrorMessage } from "../../../../shared/utils/getApiErrorMessage";
import type { AulaProgramada, PeriodoContagem } from "../../types";
import type { MensagemGerada } from "../../../mensagens/types/mensagem";

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

  const [turmaSelecionada, setTurmaSelecionada] = useState<{ id: number; nome: string } | null>(null);
  const [periodo, setPeriodo] = useState<PeriodoContagem>("SEMANAL");

  const [programacoes, setProgramacoes] = useState<AulaProgramada[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");

  const [modalAberto, setModalAberto] = useState(false);
  const [modalReplicarAberto, setModalReplicarAberto] = useState(false);
  const [programacaoEditando, setProgramacaoEditando] = useState<AulaProgramada | null>(null);
  const [avisosCancelamento, setAvisosCancelamento] = useState<MensagemGerada[] | null>(null);

  const [salvando, setSalvando] = useState(false);
  const [iniciandoId, setIniciandoId] = useState<number | null>(null);
  const [excluindoId, setExcluindoId] = useState<number | null>(null);
  const [cancelandoId, setCancelandoId] = useState<number | null>(null);

  const ehAdmin = usuario?.perfil === "ADMIN";

  async function carregarProgramacoes() {
    if (!turmaSelecionada) return;

    try {
      setLoading(true);
      setErro("");
      const data = await AulaService.listarProgramadas({ turmaId: turmaSelecionada.id, periodo });
      setProgramacoes(data);
    } catch (error) {
      setErro(getApiErrorMessage(error, "Erro ao carregar programação."));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregarProgramacoes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [turmaSelecionada, periodo]);

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
      if (turmaSelecionada) await carregarProgramacoes();
      setModalAberto(false);
    } catch (error) {
      setErro(getApiErrorMessage(error, "Erro ao programar aula."));
    } finally {
      setSalvando(false);
    }
  }

  async function handleReplicar(data: ReplicarProgramacaoFormData) {
    try {
      setSalvando(true);
      setErro("");
      const resultado = await AulaService.replicarProgramada({
        turmaId: Number(data.turmaId),
        aulaCurriculoId: data.aulaCurriculoId ? Number(data.aulaCurriculoId) : undefined,
        dataInicio: data.dataInicio,
        dataFim: data.dataFim,
        diasSemana: data.diasSemana,
        observacoes: data.observacoes || undefined,
      });
      if (turmaSelecionada) await carregarProgramacoes();
      setModalReplicarAberto(false);
      window.alert(
        `${resultado.criadas} aula(s) programada(s) com sucesso.` +
          (resultado.ignoradasPorDuplicidade > 0
            ? ` ${resultado.ignoradasPorDuplicidade} data(s) já tinham programação e foram ignoradas.`
            : "")
      );
    } catch (error) {
      setErro(getApiErrorMessage(error, "Erro ao replicar programação."));
    } finally {
      setSalvando(false);
    }
  }

  async function handleEditar(data: EditarProgramacaoFormData) {
    if (!programacaoEditando) return;

    try {
      setSalvando(true);
      setErro("");
      await AulaService.atualizarProgramada(programacaoEditando.id, {
        data: data.data,
        aulaCurriculoId: data.aulaCurriculoId ? Number(data.aulaCurriculoId) : null,
        observacoes: data.observacoes || null,
      });
      await carregarProgramacoes();
      setProgramacaoEditando(null);
    } catch (error) {
      setErro(getApiErrorMessage(error, "Erro ao editar programação."));
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

  async function handleCancelar(programacao: AulaProgramada) {
    if (!window.confirm(`Cancelar a aula de ${programacao.turma.nome} em ${formatarDataHora(programacao.data)}?`)) {
      return;
    }

    try {
      setCancelandoId(programacao.id);
      setErro("");
      const resultado = await AulaService.cancelarProgramada(programacao.id);
      await carregarProgramacoes();
      setAvisosCancelamento(resultado.avisos);
    } catch (error) {
      setErro(getApiErrorMessage(error, "Erro ao cancelar programação."));
    } finally {
      setCancelandoId(null);
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
            <>
              <Button type="button" size="sm" onClick={() => handleIniciar(p.id)} disabled={iniciandoId === p.id}>
                {iniciandoId === p.id ? "Iniciando..." : "Iniciar Aula"}
              </Button>

              <Button type="button" size="sm" variant="secondary" onClick={() => setProgramacaoEditando(p)}>
                Editar
              </Button>

              <Button
                type="button"
                size="sm"
                variant="danger"
                disabled={cancelandoId === p.id}
                onClick={() => handleCancelar(p)}
              >
                {cancelandoId === p.id ? "Cancelando..." : "Cancelar"}
              </Button>
            </>
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
        <Button type="button" variant="secondary" onClick={() => setModalReplicarAberto(true)}>
          Replicar Programação
        </Button>
      </div>

      <ErrorMessage message={erro} />

      {!turmaSelecionada ? (
        <ResumoTurmas
          colunaQuantidade="Aulas Programadas"
          periodo={periodo}
          onPeriodoChange={setPeriodo}
          carregarResumo={AulaService.resumoTurmasProgramadas}
          onSelecionarTurma={(turmaId, turmaNome) => setTurmaSelecionada({ id: turmaId, nome: turmaNome })}
        />
      ) : (
        <>
          <div className="programacao-drill-cabecalho">
            <Button type="button" variant="secondary" onClick={() => setTurmaSelecionada(null)}>
              ← Voltar para turmas
            </Button>
            <h2>{turmaSelecionada.nome}</h2>
          </div>

          {loading ? (
            <Loading />
          ) : programacoes.length === 0 ? (
            <EmptyState
              title="Nenhuma aula programada"
              description="Programe a próxima aula desta turma ou ajuste o período."
            />
          ) : (
            <Table columns={columns} data={programacoes} />
          )}
        </>
      )}

      <Modal open={modalAberto} title="Programar Aula" onClose={() => setModalAberto(false)}>
        <ProgramarAulaForm loading={salvando} onSubmit={handleProgramar} />
      </Modal>

      <Modal
        open={modalReplicarAberto}
        title="Replicar Programação"
        onClose={() => setModalReplicarAberto(false)}
      >
        <ReplicarProgramacaoForm
          turmaIdInicial={turmaSelecionada?.id}
          loading={salvando}
          onSubmit={handleReplicar}
        />
      </Modal>

      <Modal
        open={programacaoEditando !== null}
        title="Editar Programação"
        onClose={() => setProgramacaoEditando(null)}
      >
        {programacaoEditando && (
          <EditarProgramacaoForm
            programacao={programacaoEditando}
            loading={salvando}
            onSubmit={handleEditar}
          />
        )}
      </Modal>

      <Modal
        open={avisosCancelamento !== null}
        title="Avisar alunos sobre o cancelamento"
        onClose={() => setAvisosCancelamento(null)}
      >
        <AvisoCancelamentoLista avisos={avisosCancelamento ?? []} />
      </Modal>
    </Layout>
  );
}
