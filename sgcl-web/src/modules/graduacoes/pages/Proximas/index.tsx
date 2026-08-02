import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "../../../../components/layout/Layout";
import { PageHeader } from "../../../../components/layout/PageHeader";
import { Button } from "../../../../components/ui/Button";
import { ErrorMessage } from "../../../../components/ui/ErrorMessage";
import { Loading } from "../../../../components/ui/Loading";
import { EmptyState } from "../../../../components/ui/EmptyState";
import { Modal } from "../../../../components/ui/Modal";
import { Pagination } from "../../../../components/ui/Pagination";
import { GraduacaoService } from "../../services/GraduacaoService";
import type { AlunoElegivel } from "../../types";
import { AlunoElegivelCard } from "../../components/AlunoElegivelCard";
import { getApiErrorMessage } from "../../../../shared/utils/getApiErrorMessage";
import { GraduacaoForm } from "../../components/GraduacaoForm";
import type { GraduacaoFormData } from "../../schema/graduacao.schema";
import { usePaginacaoCliente } from "../../../../hooks/usePaginacaoCliente";
import "./styles.css";
export function ProximasGraduacoes() {
  const navigate = useNavigate();
  const [alunos, setAlunos] = useState<AlunoElegivel[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [alunoSelecionado, setAlunoSelecionado] = useState<AlunoElegivel | null>(null);

  const totalElegiveis = alunos.filter((aluno) => aluno.aptoGraduacao).length;

  // mais perto da graduação primeiro: elegíveis (podem promover já) antes
  // dos demais, e dentro de cada grupo, quem já acumulou mais aulas.
  const alunosOrdenados = [...alunos].sort((a, b) => {
    if (a.aptoGraduacao !== b.aptoGraduacao) return a.aptoGraduacao ? -1 : 1;
    return b.presencas - a.presencas;
  });

  const paginacao = usePaginacaoCliente(alunosOrdenados, 12);

  async function carregarProximas() {
    try {
      setLoading(true);
      setErro("");
      const data = await GraduacaoService.listarProgressoGraduacoes();
      setAlunos(data);
    } catch (error) {
      setErro(getApiErrorMessage(error, "Erro ao carregar alunos."));
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
        subtitle={`Alunos elegíveis para promoção (${totalElegiveis}) e progresso dos demais.`}
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
          title="Nenhum aluno ativo cadastrado"
          description="Cadastre alunos para acompanhar o progresso de graduação aqui."
        />
      ) : (
        <>
          <div className="proximas-grid">
            {paginacao.itensDaPagina.map((aluno) => (
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

          <Pagination
            paginaAtual={paginacao.paginaAtual}
            totalPaginas={paginacao.totalPaginas}
            totalItens={paginacao.totalItens}
            itensPorPagina={paginacao.itensPorPagina}
            onChangePagina={paginacao.irParaPagina}
          />
        </>
      )}
    </Layout>
  );
}