import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "../../../../components/layout/Layout";
import { PageHeader } from "../../../../components/layout/PageHeader";
import { Button } from "../../../../components/ui/Button";
import { Input } from "../../../../components/ui/Input";
import { ErrorMessage } from "../../../../components/ui/ErrorMessage";
import { Table } from "../../../../components/ui/Table";
import { EmptyState } from "../../../../components/ui/EmptyState";
import { Loading } from "../../../../components/ui/Loading";
import { useGraduacoes } from "../../hooks/useGraduacoes";
import { GraduacaoService } from "../../services/GraduacaoService";
import { formatarData } from "../../utils/helpers";
import { getApiErrorMessage } from "../../../../shared/utils/getApiErrorMessage";
import { GraduacaoForm } from "../../components/GraduacaoForm";
import type { Graduacao } from "../../types";
import type { GraduacaoFormData } from "../../schema/graduacao.schema";
import "./styles.css";
export function ListarGraduacoes() {
  const navigate = useNavigate();
  const { graduacoes, loading, erro, setErro, carregarGraduacoes } = useGraduacoes();
  const [salvando, setSalvando] = useState(false);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [busca, setBusca] = useState("");
  const graduacoesFiltradas = graduacoes.filter((g) =>
    g.aluno?.nome.toLowerCase().includes(busca.toLowerCase())
  );
  async function handleRegistrarGraduacao(data: GraduacaoFormData) {
    try {
      setSalvando(true);
      setErro("");
      await GraduacaoService.criar(data);
      await carregarGraduacoes();
      setMostrarForm(false);
    } catch (error) {
      setErro(getApiErrorMessage(error, "Erro ao registrar graduação."));
    } finally {
      setSalvando(false);
    }
  }
  const columns = [
    {
      header: "Aluno",
      accessor: "aluno" as const,
      render: (grad: Graduacao) => grad.aluno?.nome,
    },
    {
      header: "Faixa",
      accessor: "faixa" as const,
    },
    {
      header: "Data",
      accessor: "data" as const,
      render: (grad: Graduacao) => formatarData(grad.data),
    },
    {
      header: "Tempo",
      accessor: "id" as const,
      render: (grad: Graduacao) =>
        `${Math.floor((Date.now() - new Date(grad.data).getTime()) / (1000 * 60 * 60 * 24))} dias atrás`,
    },
    {
      header: "Ações",
      accessor: "alunoId" as const,
      render: (grad: Graduacao) => (
        <Button
          type="button"
          variant="secondary"
          onClick={() => navigate(`/alunos/${grad.alunoId}`)}
        >
          Ver aluno
        </Button>
      ),
    },
  ];
  return (
    <Layout>
      <PageHeader
        title="Graduações"
        subtitle="Histórico de promoções e progressão de faixas."
      />
      <ErrorMessage message={erro} />
      <div className="graduacoes-toolbar">
        <Input
          label="Buscar aluno"
          placeholder="Digite o nome..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
        />
        <Button
          type="button"
          variant={mostrarForm ? "secondary" : "primary"}
          onClick={() => setMostrarForm((valor) => !valor)}
        >
          {mostrarForm ? "Cancelar" : "+ Registrar Graduação"}
        </Button>
      </div>
      {mostrarForm && (
        <div className="graduacoes-form">
          <GraduacaoForm loading={salvando} onSubmit={handleRegistrarGraduacao} />
        </div>
      )}
      {loading ? (
        <Loading />
      ) : graduacoesFiltradas.length === 0 ? (
        <EmptyState
          title="Nenhuma graduação encontrada"
          description="Registre uma nova graduação ou ajuste sua pesquisa."
        />
      ) : (
        <Table columns={columns} data={graduacoesFiltradas} />
      )}
    </Layout>
  );
}