import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { Layout } from "../../../../components/layout/Layout";
import { PageHeader } from "../../../../components/layout/PageHeader";
import { Button } from "../../../../components/ui/Button";
import { Input } from "../../../../components/ui/Input";
import { ErrorMessage } from "../../../../components/ui/ErrorMessage";
import { EmptyState } from "../../../../components/ui/EmptyState";
import { Loading } from "../../../../components/ui/Loading";
import { Modal } from "../../../../components/ui/Modal";

import { CompeticaoService } from "../../services/CompeticaoService";
import { getApiErrorMessage } from "../../../../shared/utils/getApiErrorMessage";
import { InscricaoForm } from "../../components/InscricaoForm";
import type { Competicao, Atleta } from "../../types/competicao";
import type { InscricaoFormData } from "../../schema/inscricao.schema";

import "./styles.css";

function formatarData(data: string): string {
  return new Date(data).toLocaleDateString("pt-BR");
}

export function DetalheCompeticao() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [competicao, setCompeticao] = useState<Competicao | null>(null);
  const [atletas, setAtletas] = useState<Atleta[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");
  const [modalAberto, setModalAberto] = useState(false);
  const [inscrevendo, setInscrevendo] = useState(false);
  const [resultados, setResultados] = useState<Record<number, string>>({});

  async function carregarDados() {
    try {
      if (!id) return;
      setLoading(true);
      setErro("");

      const [competicoes, listaAtletas] = await Promise.all([
        CompeticaoService.listar(),
        CompeticaoService.listarAtletas(Number(id)),
      ]);

      setCompeticao(competicoes.find((c) => c.id === Number(id)) ?? null);
      setAtletas(listaAtletas);
      setResultados(
        Object.fromEntries(listaAtletas.map((a) => [a.id, a.resultado ?? ""]))
      );
    } catch (error) {
      setErro(getApiErrorMessage(error, "Erro ao carregar competição."));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregarDados();
  }, [id]);

  async function handleInscrever(data: InscricaoFormData) {
    try {
      if (!id) return;
      setInscrevendo(true);
      setErro("");
      await CompeticaoService.inscrever(Number(id), Number(data.alunoId));
      await carregarDados();
      setModalAberto(false);
    } catch (error) {
      setErro(getApiErrorMessage(error, "Erro ao inscrever aluno."));
    } finally {
      setInscrevendo(false);
    }
  }

  async function handleSalvarResultado(atletaId: number) {
    try {
      setErro("");
      await CompeticaoService.registrarResultado(atletaId, resultados[atletaId] ?? "");
      await carregarDados();
    } catch (error) {
      setErro(getApiErrorMessage(error, "Erro ao registrar resultado."));
    }
  }

  if (loading) {
    return (
      <Layout>
        <Loading />
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="competicao-detalhe-voltar">
        <Button type="button" variant="secondary" onClick={() => navigate("/competicoes")}>
          ← Voltar
        </Button>
      </div>

      <PageHeader
        title={competicao?.nome ?? "Competição"}
        subtitle={
          competicao
            ? `${formatarData(competicao.data)} — ${competicao.local}`
            : "Atletas inscritos."
        }
      />

      <ErrorMessage message={erro} />

      <div className="competicao-detalhe-acoes">
        <Button type="button" onClick={() => setModalAberto(true)}>
          + Inscrever Aluno
        </Button>
      </div>

      {atletas.length === 0 ? (
        <EmptyState
          title="Nenhum atleta inscrito"
          description="Inscreva o primeiro aluno nesta competição."
        />
      ) : (
        <div className="competicao-detalhe-lista">
          {atletas.map((atleta) => (
            <div key={atleta.id} className="competicao-atleta-card">
              <div>
                <strong>{atleta.aluno.nome}</strong>
                <span>{atleta.aluno.faixa}</span>
              </div>

              <div className="competicao-atleta-resultado">
                <Input
                  label="Resultado"
                  placeholder="Ex: Ouro, Prata, Bronze..."
                  value={resultados[atleta.id] ?? ""}
                  onChange={(e) =>
                    setResultados((atual) => ({ ...atual, [atleta.id]: e.target.value }))
                  }
                />
                <Button type="button" variant="secondary" onClick={() => handleSalvarResultado(atleta.id)}>
                  Salvar
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={modalAberto}
        title="Inscrever Aluno"
        onClose={() => setModalAberto(false)}
      >
        <InscricaoForm loading={inscrevendo} onSubmit={handleInscrever} />
      </Modal>
    </Layout>
  );
}