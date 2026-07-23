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
import type { Aluno } from "../../types";

import { AlunoService } from "../../services/AlunoService";

import "./styles.css";

export function Alunos() {
  const navigate = useNavigate();

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

      <div className="alunos-actions">
        <Button
          type="button"
          onClick={() => navigate("/alunos/cadastro")}
        >
          + Novo Aluno
        </Button>
      </div> 

      {/* <form
        onSubmit={salvarAluno}
        className="alunos-form"
      >
        <Input
          label="Nome"
          placeholder="Nome do aluno"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
        />

        <Input
          label="Data de nascimento"
          type="date"
          value={dataNascimento}
          onChange={(e) => setDataNascimento(e.target.value)}
        />

        <Input
          label="Telefone"
          placeholder="(61) 99999-9999"
          value={telefone}
          onChange={(e) => setTelefone(e.target.value)}
        />

        <Button type="submit" disabled={salvando}>
          {salvando
            ? "Salvando..."
            : editandoId
            ? "Salvar Alterações"
            : "Cadastrar"}
        </Button>
      </form> */}

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
      ) : (
        <Table columns={columns} data={alunosFiltrados} />
      )}
    </Layout>
  );
}