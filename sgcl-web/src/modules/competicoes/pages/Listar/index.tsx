import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { Layout } from "../../../../components/layout/Layout";
import { PageHeader } from "../../../../components/layout/PageHeader";
import { Button } from "../../../../components/ui/Button";
import { ErrorMessage } from "../../../../components/ui/ErrorMessage";
import { Table } from "../../../../components/ui/Table";
import { EmptyState } from "../../../../components/ui/EmptyState";
import { Loading } from "../../../../components/ui/Loading";
import { Modal } from "../../../../components/ui/Modal";

import { useAuth } from "../../../../contexts/useAuth";
import { useCompeticoes } from "../../hooks/useCompeticoes";
import { CompeticaoService } from "../../services/CompeticaoService";
import { getApiErrorMessage } from "../../../../shared/utils/getApiErrorMessage";
import { CompeticaoForm } from "../../components/CompeticaoForm";
import type { Competicao } from "../../types/competicao";
import type { CompeticaoFormData } from "../../schema/competicao.schema";

import "./styles.css";

function formatarData(data: string): string {
  return new Date(data).toLocaleDateString("pt-BR");
}

export function Competicoes() {
  const navigate = useNavigate();
  const { usuario } = useAuth();
  const { competicoes, loading, erro, setErro, carregarCompeticoes } = useCompeticoes();
  const [modalAberto, setModalAberto] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [excluindoId, setExcluindoId] = useState<number | null>(null);

  const ehAdmin = usuario?.perfil === "ADMIN";

  async function handleCriarCompeticao(data: CompeticaoFormData) {
    try {
      setSalvando(true);
      setErro("");
      await CompeticaoService.criar(data);
      await carregarCompeticoes();
      setModalAberto(false);
    } catch (error) {
      setErro(getApiErrorMessage(error, "Erro ao cadastrar competição."));
    } finally {
      setSalvando(false);
    }
  }

  async function handleExcluirCompeticao(competicao: Competicao) {
    if (!window.confirm(`Excluir a competição "${competicao.nome}"? Essa ação não pode ser desfeita.`)) {
      return;
    }

    try {
      setExcluindoId(competicao.id);
      setErro("");
      await CompeticaoService.excluir(competicao.id);
      await carregarCompeticoes();
    } catch (error) {
      setErro(getApiErrorMessage(error, "Erro ao excluir competição."));
    } finally {
      setExcluindoId(null);
    }
  }

  const columns = [
    { header: "Nome", accessor: "nome" as const },
    {
      header: "Data",
      accessor: "data" as const,
      render: (competicao: Competicao) => formatarData(competicao.data),
    },
    { header: "Local", accessor: "local" as const },
    {
      header: "Ações",
      accessor: "id" as const,
      render: (competicao: Competicao) => (
        <div className="competicoes-acoes-linha">
          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={() => navigate(`/competicoes/${competicao.id}`)}
          >
            Ver atletas
          </Button>

          {ehAdmin && (
            <Button
              type="button"
              size="sm"
              variant="danger"
              disabled={excluindoId === competicao.id}
              onClick={() => handleExcluirCompeticao(competicao)}
            >
              {excluindoId === competicao.id ? "Excluindo..." : "Excluir"}
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <Layout>
      <PageHeader title="Competições" subtitle="Gestão de competições e atletas inscritos." />

      <div className="competicoes-acoes">
        <Button type="button" onClick={() => setModalAberto(true)}>
          + Nova Competição
        </Button>
      </div>

      <ErrorMessage message={erro} />

      {loading ? (
        <Loading />
      ) : competicoes.length === 0 ? (
        <EmptyState
          title="Nenhuma competição cadastrada"
          description="Cadastre a primeira competição."
        />
      ) : (
        <Table columns={columns} data={competicoes} />
      )}

      <Modal
        open={modalAberto}
        title="Nova Competição"
        onClose={() => setModalAberto(false)}
      >
        <CompeticaoForm loading={salvando} onSubmit={handleCriarCompeticao} />
      </Modal>
    </Layout>
  );
}