import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { Layout } from "../../../../components/layout/Layout";
import { PageHeader } from "../../../../components/layout/PageHeader";

import { Button } from "../../../../components/ui/Button";
import { Input } from "../../../../components/ui/Input";
import { ErrorMessage } from "../../../../components/ui/ErrorMessage";
import { Table } from "../../../../components/ui/Table";
import { StatusBadge } from "../../../../components/ui/StatusBadge";
import { EmptyState } from "../../../../components/ui/EmptyState";
import { Loading } from "../../../../components/ui/Loading";
import { Tooltip } from "../../../../components/ui/Tooltip";

import { calcularIdade } from "../../../../shared/formatters/data";
import { calcularStatusFinanceiroAluno } from "../../utils/statusFinanceiro";

import { getApiErrorMessage } from "../../../../shared/utils/getApiErrorMessage";
import { useAlunos } from "../../hooks/useAlunos";
import { useAuth } from "../../../../contexts/useAuth";
import { usePaginacaoCliente } from "../../../../hooks/usePaginacaoCliente";
import type { Aluno, AlunoBasico } from "../../types";

import { AlunoService } from "../../services/AlunoService";

import "./styles.css";

export function Alunos() {
  const navigate = useNavigate();
  const { usuario } = useAuth();

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
    return (
      aluno.nome.toLowerCase().includes(termo) ||
      (aluno.apelido ?? "").toLowerCase().includes(termo)
    );
  });

  // pro PROFESSOR o backend já devolve esse recorte (mesmo endpoint) —
  // o cast só ajusta o tipo do lado do cliente pra bater com o que veio.
  const alunosBasicosFiltrados = alunosFiltrados as unknown as AlunoBasico[];

  const paginacaoCompleta = usePaginacaoCliente(alunosFiltrados, 15, [busca]);
  const paginacaoBasica = usePaginacaoCliente(alunosBasicosFiltrados, 15, [busca]);

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
        <Button type="button" size="sm" onClick={() => navigate(`/alunos/${aluno.id}`)}>
          Detalhes
        </Button>
      ),
    },
  ];

  const columns = [
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
            size="sm"
            onClick={() => navigate(`/alunos/${aluno.id}`)}
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

      <div className="alunos-search">
        <Input
          label="Pesquisar aluno"
          placeholder="Digite o nome..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
        />
      </div>

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
    </Layout>
  );
}