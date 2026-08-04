import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "../../../../components/layout/Layout";
import { PageHeader } from "../../../../components/layout/PageHeader";
import { Button } from "../../../../components/ui/Button";
import { Badge } from "../../../../components/ui/Badge";
import { FilterBar } from "../../../../components/ui/FilterBar";
import { ErrorMessage } from "../../../../components/ui/ErrorMessage";
import { Table } from "../../../../components/ui/Table";
import { EmptyState } from "../../../../components/ui/EmptyState";
import { Loading } from "../../../../components/ui/Loading";
import { useAuth } from "../../../../contexts/useAuth";
import { useGraduacoes } from "../../hooks/useGraduacoes";
import { GraduacaoService } from "../../services/GraduacaoService";
import { formatarData, formatarTempoRelativo } from "../../utils/helpers";
import { getApiErrorMessage } from "../../../../shared/utils/getApiErrorMessage";
import { GraduacaoForm } from "../../components/GraduacaoForm";
import { SolicitacoesPendentesGraduacao } from "../../components/SolicitacoesPendentesGraduacao";
import type { Graduacao, StatusGraduacao } from "../../types";
import type { GraduacaoFormData } from "../../schema/graduacao.schema";
import "./styles.css";

const BADGE_STATUS: Record<StatusGraduacao, { label: string; variant: "warning" | "success" | "danger" }> = {
  pendente: { label: "Pendente", variant: "warning" },
  aprovada: { label: "Aprovada", variant: "success" },
  rejeitada: { label: "Rejeitada", variant: "danger" },
};

export function ListarGraduacoes() {
  const navigate = useNavigate();
  const { usuario } = useAuth();
  const { graduacoes, loading, erro, setErro, carregarGraduacoes } = useGraduacoes();
  const solicitacoesPendentes = graduacoes.filter((g) => g.status === "pendente");
  const [salvando, setSalvando] = useState(false);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [busca, setBusca] = useState("");
  const graduacoesFiltradas = graduacoes.filter((g) =>
    g.aluno?.nome.toLowerCase().includes(busca.toLowerCase())
  );
  const podeRegistrarDireto = usuario?.perfil === "ADMIN";
  // instante único de referência pra "Tempo" (evita recomputar Date.now()
  // pra cada linha da tabela — mesmo padrão usado em TimelineGraduacoes).
  const [agora] = useState(() => Date.now());
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
      header: "Grau",
      accessor: "alunoId" as const,
      render: (grad: Graduacao) => grad.aluno?.grau ?? "-",
    },
    {
      header: "Status",
      accessor: "status" as const,
      render: (grad: Graduacao) => {
        const badge = BADGE_STATUS[grad.status];
        return <Badge variant={badge.variant}>{badge.label}</Badge>;
      },
    },
    {
      header: "Data",
      accessor: "data" as const,
      render: (grad: Graduacao) => formatarData(grad.data),
    },
    {
      header: "Tempo",
      accessor: "id" as const,
      render: (grad: Graduacao) => formatarTempoRelativo(grad.data, agora),
    },
    {
      header: "Ações",
      accessor: "alunoId" as const,
      render: (grad: Graduacao) => (
        <Button
          type="button"
          size="sm"
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
        action={
          podeRegistrarDireto && (
            <Button
              type="button"
              variant={mostrarForm ? "secondary" : "primary"}
              onClick={() => setMostrarForm((valor) => !valor)}
            >
              {mostrarForm ? "Cancelar" : "+ Registrar Graduação"}
            </Button>
          )
        }
      />
      <ErrorMessage message={erro} />

      {podeRegistrarDireto && (
        <SolicitacoesPendentesGraduacao solicitacoes={solicitacoesPendentes} onAtualizar={carregarGraduacoes} />
      )}

      <FilterBar
        buscaLabel="Buscar aluno"
        buscaPlaceholder="Digite o nome..."
        buscaValue={busca}
        onBuscaChange={setBusca}
      />
      {mostrarForm && podeRegistrarDireto && (
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