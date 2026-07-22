import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "../../../../components/layout/Layout";
import { PageHeader } from "../../../../components/layout/PageHeader";
import { Button } from "../../../../components/ui/Button";
import { ErrorMessage } from "../../../../components/ui/ErrorMessage";
import { Loading } from "../../../../components/ui/Loading";
import { EmptyState } from "../../../../components/ui/EmptyState";
import { Modal } from "../../../../components/ui/Modal";
import { GraduacaoService } from "../../services/GraduacaoService";
import type { AlunoElegivel } from "../../types";
import { AlunoElegivelCard } from "../../components/AlunoElegivelCard";
import { getApiErrorMessage } from "../../../../shared/utils/getApiErrorMessage";
import { GraduacaoForm } from "../../components/GraduacaoForm";
import type { GraduacaoFormData } from "../../schema/graduacao.schema";
import "./styles.css";
export function ProximasGraduacoes() {
  const navigate = useNavigate();
  const [alunos, setAlunos] = useState<AlunoElegivel[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [alunoSelecionado, setAlunoSelecionado] = useState<AlunoElegivel | null>(null);
  async function carregarProximas() {
    try {
      setLoading(true);
      setErro("");
      const data = await GraduacaoService.listarProximas();
      setAlunos(data);
    } catch (error) {
      setErro(getApiErrorMessage(error, "Erro ao carregar alunos elegíveis."));
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    carregarProximas();
  }, []);
  async function handleRegistrar(data: GraduacaoFormData) {
    try {
      setSalvando(true);
      setErro("");
      await GraduacaoService.criar(data);
      setAlunoSelecionado(null);
      await carregarProximas();
    } catch (error) {
      setErro(getApiErrorMessage(error, "Erro ao registrar graduação."));
    } finally {
      setSalvando(false);
    }
  }
  return (
    <Layout>
      <div className="proximas-voltar">
        <Button type="button" variant="secondary" onClick={() => navigate("/graduacoes")}>
          ← Voltar
        </Button>
      </div>
      <PageHeader
        title="Próximas Graduações"
        subtitle={`Alunos elegíveis para promoção (${alunos.length}).`}
      />
      <ErrorMessage message={erro} />
      <Modal
        open={!!alunoSelecionado}
        title={`Promover ${alunoSelecionado?.nome ?? ""}`}
        onClose={() => setAlunoSelecionado(null)}
      >
        <GraduacaoForm loading={salvando} onSubmit={handleRegistrar} />
      </Modal>
      {loading ? (
        <Loading />
      ) : alunos.length === 0 ? (
        <EmptyState
          title="Nenhum aluno elegível no momento"
          description="Alunos precisam de 8 ou mais aulas para aparecer aqui."
        />
      ) : (
        <div className="proximas-grid">
          {alunos.map((aluno) => (
            <AlunoElegivelCard
              key={aluno.alunoId}
              aluno={aluno}
              onPromover={(id) => {
                const a = alunos.find((x) => x.alunoId === id);
                if (a) setAlunoSelecionado(a);
              }}
            />
          ))}
        </div>
      )}
    </Layout>
  );
}