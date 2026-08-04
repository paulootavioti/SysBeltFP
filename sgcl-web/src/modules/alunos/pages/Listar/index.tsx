import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { Layout } from "../../../../components/layout/Layout";
import { PageHeader } from "../../../../components/layout/PageHeader";

import { Button } from "../../../../components/ui/Button";
import { Select } from "../../../../components/ui/Select";
import { Checkbox } from "../../../../components/ui/Checkbox";
import { FilterBar, type FilterBarSelect } from "../../../../components/ui/FilterBar";
import { ErrorMessage } from "../../../../components/ui/ErrorMessage";
import { Table } from "../../../../components/ui/Table";
import { StatusBadge } from "../../../../components/ui/StatusBadge";
import { EmptyState } from "../../../../components/ui/EmptyState";
import { Loading } from "../../../../components/ui/Loading";
import { Tooltip } from "../../../../components/ui/Tooltip";
import { TrilhaFaixa } from "../../../../components/ui/TrilhaFaixa";
import { Modal } from "../../../../components/ui/Modal";
import { ConfirmDialog } from "../../../../components/ui/ConfirmDialog";

import { calcularIdade } from "../../../../shared/formatters/data";
import { calcularStatusFinanceiroAluno } from "../../utils/statusFinanceiro";

import { getApiErrorMessage } from "../../../../shared/utils/getApiErrorMessage";
import { useAlunos } from "../../hooks/useAlunos";
import { useAuth } from "../../../../contexts/useAuth";
import { useToast } from "../../../../contexts/toast/useToast";
import { usePaginacaoCliente } from "../../../../hooks/usePaginacaoCliente";
import type { Aluno, AlunoBasico } from "../../types";

import { AlunoService } from "../../services/AlunoService";
import { TurmaService } from "../../../turmas/services/TurmaService";

import "./styles.css";

export function Alunos() {
  const navigate = useNavigate();
  const { usuario } = useAuth();
  const toast = useToast();

  // o backend já devolve o recorte básico (nome, apelido, responsável,
  // turma) pra PROFESSOR nesse mesmo endpoint — só muda como renderizamos.
  const ehProfessor = usuario?.perfil === "PROFESSOR";

  const {
    alunos,
    loading,
    erro,
    setErro,
    carregarAlunos,
  } = useAlunos();


  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("");
  const [filtroTurma, setFiltroTurma] = useState("");
  const [selecionados, setSelecionados] = useState<Set<number>>(new Set());

  const [modalMoverAberto, setModalMoverAberto] = useState(false);
  const [turmaDestino, setTurmaDestino] = useState("");
  const [movendo, setMovendo] = useState(false);

  const [confirmandoInativar, setConfirmandoInativar] = useState(false);
  const [inativando, setInativando] = useState(false);

  const opcoesTurma = Array.from(
    new Map(
      alunos
        .filter((aluno) => aluno.turma)
        .map((aluno) => [aluno.turma!.id, aluno.turma!.nome])
    ).entries()
  )
    .sort((a, b) => a[1].localeCompare(b[1]))
    .map(([id, nome]) => ({ value: String(id), label: nome }));

  const rotuloStatus: Record<string, string> = { ATIVO: "Ativo", INATIVO: "Inativo" };

  const filtrosAtivos = [
    filtroStatus && { chave: "status", rotulo: `Status: ${rotuloStatus[filtroStatus]}`, limpar: () => setFiltroStatus("") },
    filtroTurma && {
      chave: "turma",
      rotulo: `Turma: ${opcoesTurma.find((opcao) => opcao.value === filtroTurma)?.label ?? filtroTurma}`,
      limpar: () => setFiltroTurma(""),
    },
  ].filter((filtro): filtro is { chave: string; rotulo: string; limpar: () => void } => !!filtro);

  async function alterarStatus(id: number) {
    try {
      setErro("");

      await AlunoService.alterarStatus(id);

      await carregarAlunos();
    } catch (error) {
      setErro(
        getApiErrorMessage(
          error,
          "Erro ao alterar status do aluno."
        )
      );
    }
  }

  const alunosFiltrados = alunos.filter((aluno) => {
    const termo = busca.toLowerCase();
    const bateBusca =
      aluno.nome.toLowerCase().includes(termo) ||
      (aluno.apelido ?? "").toLowerCase().includes(termo);

    const bateStatus =
      filtroStatus === "" || (aluno.ativo ? "ATIVO" : "INATIVO") === filtroStatus;

    const bateTurma = filtroTurma === "" || String(aluno.turma?.id ?? "") === filtroTurma;

    return bateBusca && bateStatus && bateTurma;
  });

  // pro PROFESSOR o backend já devolve esse recorte (mesmo endpoint) —
  // o cast só ajusta o tipo do lado do cliente pra bater com o que veio.
  const alunosBasicosFiltrados = alunosFiltrados as unknown as AlunoBasico[];

  const paginacaoCompleta = usePaginacaoCliente(alunosFiltrados, 15, [busca, filtroStatus, filtroTurma]);
  const paginacaoBasica = usePaginacaoCliente(alunosBasicosFiltrados, 15, [busca, filtroTurma]);

  const idsDaPagina = paginacaoCompleta.itensDaPagina.map((aluno) => aluno.id);
  const todosDaPaginaSelecionados = idsDaPagina.length > 0 && idsDaPagina.every((id) => selecionados.has(id));

  function alternarSelecaoTodos() {
    setSelecionados((atual) => {
      const proximo = new Set(atual);
      if (todosDaPaginaSelecionados) {
        idsDaPagina.forEach((id) => proximo.delete(id));
      } else {
        idsDaPagina.forEach((id) => proximo.add(id));
      }
      return proximo;
    });
  }

  function alternarSelecao(id: number) {
    setSelecionados((atual) => {
      const proximo = new Set(atual);
      if (proximo.has(id)) proximo.delete(id);
      else proximo.add(id);
      return proximo;
    });
  }

  function limparSelecao() {
    setSelecionados(new Set());
  }

  async function confirmarMoverTurma() {
    if (!turmaDestino || selecionados.size === 0) return;

    try {
      setMovendo(true);
      setErro("");
      await Promise.all(
        Array.from(selecionados).map((alunoId) => TurmaService.vincularAluno(Number(turmaDestino), alunoId))
      );
      toast.success(`${selecionados.size} aluno(s) movido(s) de turma.`);
      setModalMoverAberto(false);
      setTurmaDestino("");
      limparSelecao();
      await carregarAlunos();
    } catch (error) {
      setErro(getApiErrorMessage(error, "Erro ao mover alunos de turma."));
    } finally {
      setMovendo(false);
    }
  }

  async function confirmarInativarSelecionados() {
    const idsParaInativar = alunos.filter((aluno) => selecionados.has(aluno.id) && aluno.ativo).map((aluno) => aluno.id);

    if (idsParaInativar.length === 0) {
      setConfirmandoInativar(false);
      return;
    }

    try {
      setInativando(true);
      setErro("");
      await Promise.all(idsParaInativar.map((id) => AlunoService.alterarStatus(id)));
      toast.success(`${idsParaInativar.length} aluno(s) marcado(s) como inativo.`);
      setConfirmandoInativar(false);
      limparSelecao();
      await carregarAlunos();
    } catch (error) {
      setErro(getApiErrorMessage(error, "Erro ao inativar alunos selecionados."));
    } finally {
      setInativando(false);
    }
  }

  const columnsBasicas = [
    {
      header: "Nome",
      accessor: "nome" as const,
    },
    {
      header: "Apelido",
      accessor: "apelido" as const,
      render: (aluno: AlunoBasico) => aluno.apelido || "-",
    },
    {
      header: "Turma",
      accessor: "turma" as const,
      render: (aluno: AlunoBasico) => aluno.turma?.nome || "Não vinculada",
    },
    {
      header: "Responsável",
      accessor: "responsaveis" as const,
      render: (aluno: AlunoBasico) =>
        aluno.responsaveis?.map((responsavel) => responsavel.nome).join(", ") || "-",
    },
    {
      header: "Ações",
      accessor: "id" as const,
      render: (aluno: AlunoBasico) => (
        <Button type="button" variant="secondary" size="sm" onClick={() => navigate(`/alunos/${aluno.id}`)}>
          Detalhes
        </Button>
      ),
    },
  ];

  const columns = [
    {
      header: "",
      accessor: "id" as const,
      render: (aluno: Aluno) => (
        <Checkbox
          label=""
          checked={selecionados.has(aluno.id)}
          onChange={() => alternarSelecao(aluno.id)}
        />
      ),
    },
    {
      header: "Nome",
      accessor: "nome" as const,
      render: (aluno: Aluno) => (
        <Tooltip
          content={
            <>
              <div>Apelido: {aluno.apelido || "-"}</div>
              <div>Turma: {aluno.turma?.nome || "Não vinculada"}</div>
            </>
          }
        >
          {aluno.nome}
        </Tooltip>
      ),
    },
    {
      header: "Idade",
      accessor: "dataNascimento" as const,
      render: (aluno: Aluno) => {
        const idade = calcularIdade(aluno.dataNascimento);

        return idade !== null ? `${idade} anos` : "-";
      },
    },
    {
      header: "Faixa",
      accessor: "faixa" as const,
      render: (aluno: Aluno) => <TrilhaFaixa faixa={aluno.faixa} comLabel />,
    },
    {
      header: "Telefone",
      accessor: "telefone" as const,
    },
    {
      header: "Status",
      accessor: "ativo" as const,
      render: (aluno: Aluno) => (
        <StatusBadge
          status={aluno.ativo ? "ATIVO" : "INATIVO"}
        />
      ),
    },
    {
      header: "Financeiro",
      accessor: "mensalidades" as const,
      render: (aluno: Aluno) => {
        const status = calcularStatusFinanceiroAluno(aluno.mensalidades);
        return status ? <StatusBadge status={status} /> : "-";
      },
    },
    {
      header: "Ações",
      accessor: "id" as const,
      render: (aluno: Aluno) => (
        <div className="alunos-table-actions">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() =>
              navigate(`/alunos/${aluno.id}`, {
                state: {
                  resumoBasico: {
                    id: aluno.id,
                    nome: aluno.nome,
                    apelido: aluno.apelido,
                    faixa: aluno.faixa,
                    grau: aluno.grau,
                    ativo: aluno.ativo,
                    turma: aluno.turma,
                    fotoUrl: aluno.fotoUrl,
                  },
                },
              })
            }
          >
            Detalhes
          </Button>

          <Button
            variant="secondary"
            type="button"
            size="sm"
            onClick={() => navigate(`/alunos/${aluno.id}/editar`)}
          >
            Editar
          </Button>

          <Button
            variant={aluno.ativo ? "danger" : "primary"}
            type="button"
            size="sm"
            onClick={() => alterarStatus(aluno.id)}
          >
            {aluno.ativo ? "Inativar" : "Ativar"}
          </Button>
        </div>
      ),
    },
  ];

  return (
    <Layout>
      <PageHeader
        title="Alunos"
        subtitle="Cadastro e gerenciamento de alunos."
      />

      {!ehProfessor && (
        <div className="alunos-actions">
          <Button
            type="button"
            onClick={() => navigate("/alunos/cadastro")}
          >
            + Novo Aluno
          </Button>
        </div>
      )}

      <ErrorMessage message={erro} />

      <FilterBar
        buscaLabel="Pesquisar aluno"
        buscaPlaceholder="Digite o nome..."
        buscaValue={busca}
        onBuscaChange={setBusca}
        selects={[
          !ehProfessor && {
            label: "Status",
            options: [
              { value: "ATIVO", label: "Ativo" },
              { value: "INATIVO", label: "Inativo" },
            ],
            value: filtroStatus,
            onChange: (value: string) => setFiltroStatus(value),
          },
          {
            label: "Turma",
            options: opcoesTurma,
            value: filtroTurma,
            onChange: (value: string) => setFiltroTurma(value),
          },
        ].filter((select): select is FilterBarSelect => !!select)}
        filtrosAtivos={filtrosAtivos}
      />

      {!ehProfessor && !loading && paginacaoCompleta.itensDaPagina.length > 0 && (
        <div className="alunos-selecionar-todos">
          <Checkbox
            label={`Selecionar todos desta página (${idsDaPagina.length})`}
            checked={todosDaPaginaSelecionados}
            onChange={alternarSelecaoTodos}
          />
        </div>
      )}

      {loading ? (
        <Loading />
      ) : alunosFiltrados.length === 0 ? (
        <EmptyState
          title="Nenhum aluno encontrado"
          description="Cadastre um novo aluno ou ajuste sua pesquisa."
        />
      ) : ehProfessor ? (
        <Table
          columns={columnsBasicas}
          data={paginacaoBasica.itensDaPagina}
          pagination={{
            paginaAtual: paginacaoBasica.paginaAtual,
            totalPaginas: paginacaoBasica.totalPaginas,
            totalItens: paginacaoBasica.totalItens,
            itensPorPagina: paginacaoBasica.itensPorPagina,
            onChangePagina: paginacaoBasica.irParaPagina,
          }}
        />
      ) : (
        <Table
          columns={columns}
          data={paginacaoCompleta.itensDaPagina}
          pagination={{
            paginaAtual: paginacaoCompleta.paginaAtual,
            totalPaginas: paginacaoCompleta.totalPaginas,
            totalItens: paginacaoCompleta.totalItens,
            itensPorPagina: paginacaoCompleta.itensPorPagina,
            onChangePagina: paginacaoCompleta.irParaPagina,
          }}
        />
      )}

      {!ehProfessor && selecionados.size > 0 && (
        <div className="alunos-acoes-lote">
          <span>{selecionados.size} selecionado(s)</span>

          <div className="alunos-acoes-lote-botoes">
            <Button type="button" variant="secondary" size="sm" onClick={() => setModalMoverAberto(true)}>
              Mover de turma
            </Button>
            <Button type="button" variant="danger" size="sm" onClick={() => setConfirmandoInativar(true)}>
              Marcar inativo
            </Button>
            <Button type="button" variant="secondary" size="sm" onClick={limparSelecao}>
              Cancelar seleção
            </Button>
          </div>
        </div>
      )}

      <Modal
        open={modalMoverAberto}
        title="Mover alunos de turma"
        onClose={() => {
          setModalMoverAberto(false);
          setTurmaDestino("");
        }}
      >
        <div className="alunos-mover-turma-form">
          <p>
            {selecionados.size} aluno(s) selecionado(s) serão vinculados à turma escolhida (substituindo a turma
            atual, se houver).
          </p>

          <Select
            label="Turma de destino"
            options={opcoesTurma}
            value={turmaDestino}
            onChange={(e) => setTurmaDestino(e.target.value)}
          />

          <Button type="button" disabled={!turmaDestino || movendo} onClick={confirmarMoverTurma}>
            {movendo ? "Movendo..." : "Mover"}
          </Button>
        </div>
      </Modal>

      <ConfirmDialog
        open={confirmandoInativar}
        title="Marcar alunos como inativo"
        message={`Deseja marcar os ${selecionados.size} aluno(s) selecionado(s) como inativo?`}
        confirmLabel="Marcar inativo"
        loading={inativando}
        onConfirm={confirmarInativarSelecionados}
        onCancel={() => setConfirmandoInativar(false)}
      />
    </Layout>
  );
}
