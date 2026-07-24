import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { Layout } from "../../../../components/layout/Layout";
import { PageHeader } from "../../../../components/layout/PageHeader";
import { Button } from "../../../../components/ui/Button";
import { Select } from "../../../../components/ui/Select";
import { ErrorMessage } from "../../../../components/ui/ErrorMessage";
import { Table } from "../../../../components/ui/Table";
import { EmptyState } from "../../../../components/ui/EmptyState";
import { Loading } from "../../../../components/ui/Loading";
import { StatusBadge } from "../../../../components/ui/StatusBadge";
import { Modal } from "../../../../components/ui/Modal";

import { TurmaService } from "../../services/TurmaService";
import { getApiErrorMessage } from "../../../../shared/utils/getApiErrorMessage";
import type { TurmaDetalhada, AlunoDaTurma } from "../../types/turma";
import type { Aluno } from "../../../alunos/types";
import { AlunoService } from "../../../alunos/services/AlunoService";

import "./styles.css";

export function DetalheTurma() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [turma, setTurma] = useState<TurmaDetalhada | null>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");
  const [modalAberto, setModalAberto] = useState(false);
  const [alunosDisponiveis, setAlunosDisponiveis] = useState<Aluno[]>([]);
  const [alunoSelecionado, setAlunoSelecionado] = useState("");
  const [vinculando, setVinculando] = useState(false);

  async function carregarTurma() {
    try {
      if (!id) return;
      setLoading(true);
      setErro("");
      const data = await TurmaService.buscar(Number(id));
      setTurma(data);
    } catch (error) {
      setErro(getApiErrorMessage(error, "Erro ao carregar turma."));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregarTurma();
  }, [id]);

  async function handleAbrirModal() {
    setModalAberto(true);
    const alunos = await AlunoService.listar();
    setAlunosDisponiveis(alunos.filter((a) => a.ativo));
  }

  async function handleVincularAluno() {
    try {
      if (!id || !alunoSelecionado) return;
      setVinculando(true);
      setErro("");
      await TurmaService.vincularAluno(Number(id), Number(alunoSelecionado));
      await carregarTurma();
      setModalAberto(false);
      setAlunoSelecionado("");
    } catch (error) {
      setErro(getApiErrorMessage(error, "Erro ao vincular aluno."));
    } finally {
      setVinculando(false);
    }
  }

  const columns = [
    { header: "Nome", accessor: "nome" as const },
    { header: "Faixa", accessor: "faixa" as const },
    {
      header: "Status",
      accessor: "ativo" as const,
      render: (aluno: AlunoDaTurma) => (
        <StatusBadge status={aluno.ativo ? "ATIVO" : "INATIVO"} />
      ),
    },
    {
      header: "Ações",
      accessor: "id" as const,
      render: (aluno: AlunoDaTurma) => (
        <Button type="button" size="sm" variant="secondary" onClick={() => navigate(`/alunos/${aluno.id}`)}>
          Ver aluno
        </Button>
      ),
    },
  ];

  if (loading) {
    return (
      <Layout>
        <Loading />
      </Layout>
    );
  }

  if (!turma) {
    return (
      <Layout>
        <ErrorMessage message={erro || "Turma não encontrada."} />
        <Button type="button" variant="secondary" onClick={() => navigate("/turmas")}>
          Voltar
        </Button>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="turma-detalhe-voltar">
        <Button type="button" variant="secondary" onClick={() => navigate("/turmas")}>
          ← Voltar
        </Button>
      </div>

      <PageHeader
        title={turma.nome}
        subtitle={`${turma.professor?.apelido || turma.professor?.nome || "Sem professor"} — ${turma.diasSemana} — ${turma.horarioInicio} às ${turma.horarioFim}${
          turma.limiteAlunos
            ? ` — ${turma.alunos.filter((a) => a.ativo).length}/${turma.limiteAlunos} vagas`
            : ""
        }`}
      />

      <ErrorMessage message={erro} />

      {turma.ativo ? (
        <div className="turma-detalhe-acoes">
          <Button type="button" onClick={handleAbrirModal}>
            + Vincular Aluno
          </Button>
        </div>
      ) : (
        <p className="turma-detalhe-inativa-aviso">
          Esta turma está inativa — não é possível vincular novos alunos a ela.
        </p>
      )}

      {turma.alunos.length === 0 ? (
        <EmptyState title="Nenhum aluno vinculado" description="Vincule o primeiro aluno a esta turma." />
      ) : (
        <Table columns={columns} data={turma.alunos} />
      )}

      <Modal open={modalAberto} title="Vincular Aluno" onClose={() => setModalAberto(false)}>
        <Select
          label="Aluno"
          options={alunosDisponiveis.map((aluno) => ({ label: aluno.nome, value: String(aluno.id) }))}
          value={alunoSelecionado}
          onChange={(e) => setAlunoSelecionado(e.target.value)}
        />

        <Button type="button" disabled={!alunoSelecionado || vinculando} onClick={handleVincularAluno}>
          {vinculando ? "Vinculando..." : "Vincular"}
        </Button>
      </Modal>
    </Layout>
  );
}