import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { Layout } from "../../../../components/layout/Layout";
import { PageHeader } from "../../../../components/layout/PageHeader";

import { Button } from "../../../../components/ui/Button";
import { Select } from "../../../../components/ui/Select";
import { Checkbox } from "../../../../components/ui/Checkbox";
import { FilterBar, type FilterBarSelect } from "../../../../components/ui/FilterBar";
import { ErrorMessage } from "../../../../components/ui/ErrorMessage";
import { DataTable } from "../../../../components/ui/DataTable";
import { Situacao } from "../../../../components/ui/Situacao";
import { EmptyState } from "../../../../components/ui/EmptyState";
import { Loading } from "../../../../components/ui/Loading";
import { TrilhaFaixa } from "../../../../components/ui/TrilhaFaixa";
import { AmostraFaixa } from "../../../../components/ui/AmostraFaixa";
import { Modal } from "../../../../components/ui/Modal";
import { ConfirmDialog } from "../../../../components/ui/ConfirmDialog";

import { calcularIdade } from "../../../../shared/formatters/data";
import { calcularStatusFinanceiroAluno } from "../../utils/statusFinanceiro";

import { getApiErrorMessage } from "../../../../shared/utils/getApiErrorMessage";
import { useAlunos } from "../../hooks/useAlunos";
import { useAuth } from "../../../../contexts/useAuth";
import { useToast } from "../../../../contexts/toast/useToast";
import type { Aluno, AlunoBasico } from "../../types";

import { AlunoService } from "../../services/AlunoService";
import { TurmaService } from "../../../turmas/services/TurmaService";
import { ImportarAlunosModal } from "../../components/ImportarAlunosModal";
import { LuEllipsis, LuFileUp, LuUserPlus } from "react-icons/lu";

import "./styles.css";

export function Alunos() {
  const navigate = useNavigate();
  const { usuario } = useAuth();
  const toast = useToast();

  // o backend já devolve o recorte básico (nome, apelido, responsável,
  // turma) pra PROFESSOR nesse mesmo endpoint — só muda como renderizamos.
  const ehProfessor = usuario?.perfil === "PROFESSOR";

  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState(() => ehProfessor ? "" : "EM_ATRASO");
  const [filtroTurma, setFiltroTurma] = useState("");
  const [pagina, setPagina] = useState(1);
  const [menuAlunoId, setMenuAlunoId] = useState<number | null>(null);
  const [selecionados, setSelecionados] = useState<Set<number>>(new Set());
  const [turmasDisponiveis, setTurmasDisponiveis] = useState<Array<{ id: number; nome: string }>>([]);

  const { alunos, total, loading, erro, setErro, carregarAlunos } = useAlunos({
    pagina,
    busca,
    status: filtroStatus,
    turmaId: filtroTurma,
  });

  useEffect(() => {
    TurmaService.listar()
      .then((turmas) => setTurmasDisponiveis(turmas.filter((turma) => turma.ativo).map(({ id, nome }) => ({ id, nome }))))
      .catch(() => setTurmasDisponiveis([]));
  }, []);

  const [modalMoverAberto, setModalMoverAberto] = useState(false);
  const [turmaDestino, setTurmaDestino] = useState("");
  const [movendo, setMovendo] = useState(false);

  const [confirmandoInativar, setConfirmandoInativar] = useState(false);
  const [importacaoAberta, setImportacaoAberta] = useState(false);
  const [inativando, setInativando] = useState(false);

  const opcoesTurma = Array.from(
    new Map(
      turmasDisponiveis.map((turma) => [turma.id, turma.nome])
    ).entries()
  )
    .sort((a, b) => a[1].localeCompare(b[1]))
    .map(([id, nome]) => ({ value: String(id), label: nome }));

  const rotuloStatus: Record<string, string> = { EM_ATRASO: "Em atraso", ATIVO: "Ativo", INATIVO: "Inativo" };

  const filtrosAtivos = [
    filtroStatus && { chave: "status", rotulo: `Status: ${rotuloStatus[filtroStatus]}`, limpar: () => { setFiltroStatus(""); setPagina(1); } },
    filtroTurma && {
      chave: "turma",
      rotulo: `Turma: ${opcoesTurma.find((opcao) => opcao.value === filtroTurma)?.label ?? filtroTurma}`,
      limpar: () => { setFiltroTurma(""); setPagina(1); },
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

  // pro PROFESSOR o backend já devolve esse recorte (mesmo endpoint) —
  // o cast só ajusta o tipo do lado do cliente pra bater com o que veio.
  const alunosBasicosFiltrados = alunos as unknown as AlunoBasico[];
  const idsDaPagina = alunos.map((aluno) => aluno.id);
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
      prioridade: 1 as const,
    },
    {
      header: "Apelido",
      accessor: "apelido" as const,
      prioridade: 2 as const,
      render: (aluno: AlunoBasico) => aluno.apelido || "-",
    },
    {
      header: "Turma",
      accessor: "turma" as const,
      prioridade: 1 as const,
      render: (aluno: AlunoBasico) => aluno.turma?.nome || "Não vinculada",
    },
    {
      header: "Responsável",
      accessor: "responsaveis" as const,
      prioridade: 2 as const,
      render: (aluno: AlunoBasico) =>
        aluno.responsaveis?.map((responsavel) => responsavel.nome).join(", ") || "-",
    },
    {
      header: "Ações",
      accessor: "id" as const,
      prioridade: 1 as const,
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
      prioridade: 1 as const,
      render: (aluno: Aluno) => (
        <Checkbox
          label=""
          checked={selecionados.has(aluno.id)}
          onChange={() => alternarSelecao(aluno.id)}
        />
      ),
    },
    {
      header: "Aluno",
      accessor: "nome" as const,
      prioridade: 1 as const,
      render: (aluno: Aluno) => (
        <span className="aluno-identidade">
          <strong>{aluno.nome}</strong>
          <small>{[aluno.apelido, `${calcularIdade(aluno.dataNascimento) ?? "-"} anos`, aluno.responsaveis?.[0]?.nome].filter(Boolean).join(" · ")}</small>
        </span>
      ),
    },
    {
      header: "Faixa",
      accessor: "faixa" as const,
      prioridade: 1 as const,
      render: (aluno: Aluno) => <span className="aluno-faixa"><AmostraFaixa cor={aluno.faixaCor} graduacao={`${aluno.faixa} · ${aluno.grau}º grau`} compacta /><TrilhaFaixa faixa={aluno.faixa} comLabel /></span>,
    },
    {
      header: "Turma",
      accessor: "turma" as const,
      prioridade: 2 as const,
      render: (aluno: Aluno) => aluno.turma?.nome ?? "Não vinculada",
    },
    {
      header: "Financeiro",
      accessor: "mensalidades" as const,
      prioridade: 1 as const,
      render: (aluno: Aluno) => {
        const status = calcularStatusFinanceiroAluno(aluno.mensalidades);
        if (!aluno.ativo) return "Aluno inativo";
        if (status === "VENCIDO") {
          const vencimento = aluno.mensalidades?.[0]?.vencimento;
          const dias = vencimento ? Math.max(1, Math.floor((Date.now() - new Date(vencimento).getTime()) / 86400000)) : null;
          return dias ? `Vencida há ${dias} dias` : "Vencida";
        }
        if (status === "PENDENTE") return "Pagamento pendente";
        if (status === "PAGO") return "Em dia";
        return "Sem mensalidade";
      },
    },
    {
      header: "Ações",
      accessor: "id" as const,
      prioridade: 1 as const,
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
            Abrir
          </Button>
          <div className="aluno-menu-wrap">
            <button type="button" className="aluno-menu-trigger" aria-label={`Mais ações para ${aluno.nome}`} aria-expanded={menuAlunoId === aluno.id} onClick={() => setMenuAlunoId(menuAlunoId === aluno.id ? null : aluno.id)}>
              <LuEllipsis />
            </button>
            {menuAlunoId === aluno.id && (
              <div className="aluno-menu" role="menu">
                <button type="button" role="menuitem" onClick={() => navigate(`/alunos/${aluno.id}/editar`)}>Editar</button>
                <button type="button" role="menuitem" className="aluno-menu-destrutivo" onClick={() => alterarStatus(aluno.id)}>{aluno.ativo ? "Inativar" : "Ativar"}</button>
              </div>
            )}
          </div>
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
          <Button type="button" variant="secondary" onClick={() => setImportacaoAberta(true)}>
            <LuFileUp /> Importar CSV
          </Button>
          <Button
            type="button"
            onClick={() => navigate("/alunos/cadastro")}
          >
            <LuUserPlus /> Novo aluno
          </Button>
        </div>
      )}

      <ErrorMessage message={erro} />

      <ImportarAlunosModal open={importacaoAberta} onClose={() => setImportacaoAberta(false)} onImportado={carregarAlunos} />

      <FilterBar
        buscaLabel="Pesquisar aluno"
        buscaPlaceholder="Digite o nome..."
        buscaValue={busca}
        onBuscaChange={(valor) => { setBusca(valor); setPagina(1); }}
        selects={[
          !ehProfessor && {
            label: "Status",
            options: [
              { value: "EM_ATRASO", label: "Em atraso" },
              { value: "ATIVO", label: "Ativo" },
              { value: "INATIVO", label: "Inativo" },
            ],
            value: filtroStatus,
            onChange: (value: string) => { setFiltroStatus(value); setPagina(1); },
          },
          {
            label: "Turma",
            options: opcoesTurma,
            value: filtroTurma,
            onChange: (value: string) => { setFiltroTurma(value); setPagina(1); },
          },
        ].filter((select): select is FilterBarSelect => !!select)}
        filtrosAtivos={filtrosAtivos}
      />

      {!ehProfessor && !loading && alunos.length > 0 && (
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
      ) : alunos.length === 0 ? (
        <EmptyState
          title="Nenhum aluno encontrado"
          description="Cadastre um novo aluno ou ajuste sua pesquisa."
        />
      ) : ehProfessor ? (
        <DataTable
          columns={columnsBasicas}
          data={alunosBasicosFiltrados}
          pageSize={15} totalItems={total} onPageChange={setPagina}
          renderCartao={(aluno) => <button type="button" className="aluno-mobile-card" onClick={() => navigate(`/alunos/${aluno.id}`)}><strong>{aluno.nome}</strong><small>{aluno.turma?.nome ?? "Sem turma"}</small><Situacao degrau="neutro">Ativo</Situacao></button>}
        />
      ) : (
        <DataTable
          columns={columns}
          data={alunos}
          pageSize={15} totalItems={total} onPageChange={setPagina}
          renderCartao={(aluno) => {
            const status = calcularStatusFinanceiroAluno(aluno.mensalidades);
            const vencimento = aluno.mensalidades?.[0]?.vencimento;
            const dias = vencimento ? Math.max(1, Math.floor((Date.now() - new Date(vencimento).getTime()) / 86400000)) : 0;
            const texto = !aluno.ativo ? "Matrícula inativa" : status === "VENCIDO" ? `Vencida há ${dias} dias` : status === "PENDENTE" ? "Pagamento pendente" : status === "PAGO" ? "Em dia" : "Sem mensalidade";
            const degrau = !aluno.ativo ? "inativo" : status === "VENCIDO" ? "acao" : status === "PENDENTE" ? "atencao" : "neutro";
            return <button type="button" className="aluno-mobile-card" onClick={() => navigate(`/alunos/${aluno.id}`)}><AmostraFaixa cor={aluno.faixaCor} graduacao={`${aluno.faixa} · ${aluno.grau}º grau`} compacta /><strong>{aluno.nome}</strong><small>{aluno.turma?.nome ?? "Sem turma"} · {aluno.faixa} · {aluno.grau}º grau</small><Situacao degrau={degrau}>{texto}</Situacao></button>;
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
