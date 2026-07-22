import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { Layout } from "../../components/layout/Layout";
import { PageHeader } from "../../components/layout/PageHeader";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Loading } from "../../components/ui/Loading";
import { ErrorMessage } from "../../components/ui/ErrorMessage";
import { PeriodoSelector, type PeriodoOpcao } from "../../components/ui/PeriodoSelector";
import { BarChart } from "../../components/ui/BarChart";

import { DashboardService, type DashboardResumo, type DashboardResumoPeriodo } from "./DashboardService";
import { GraduacaoService } from "../../modules/graduacoes/services/GraduacaoService";
import type { AlunoElegivel } from "../../modules/graduacoes/types";
import { getApiErrorMessage } from "../../shared/utils/getApiErrorMessage";

import "./styles.css";

const RUBRICA_PERIODO: Record<PeriodoOpcao, string> = {
  DIARIO: "Hoje, por hora",
  SEMANAL: "Últimos 7 dias",
  MENSAL: "Este mês, dia a dia",
  ANUAL: "Este ano, mês a mês",
};

function formatarMoeda(valor: number): string {
  return `R$ ${valor.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function Dashboard() {
  const navigate = useNavigate();

  const [dados, setDados] = useState<DashboardResumo | null>(null);
  const [proximasGraduacoes, setProximasGraduacoes] = useState<AlunoElegivel[]>([]);
  const [erro, setErro] = useState("");

  const [periodo, setPeriodo] = useState<PeriodoOpcao>("MENSAL");
  const [resumoPeriodo, setResumoPeriodo] = useState<DashboardResumoPeriodo | null>(null);
  const [carregandoPeriodo, setCarregandoPeriodo] = useState(true);

  useEffect(() => {
    async function carregar() {
      try {
        setErro("");
        const [resumo, elegiveis] = await Promise.all([
          DashboardService.resumo(),
          GraduacaoService.listarProximas(),
        ]);

        setDados(resumo);
        setProximasGraduacoes(elegiveis);
      } catch (error) {
        setErro(getApiErrorMessage(error, "Erro ao carregar dashboard."));
      }
    }

    carregar();
  }, []);

  useEffect(() => {
    let ativo = true;

    async function carregarPeriodo() {
      try {
        setCarregandoPeriodo(true);
        const resumo = await DashboardService.resumoPeriodo(periodo);
        if (ativo) setResumoPeriodo(resumo);
      } catch {
        if (ativo) setResumoPeriodo(null);
      } finally {
        if (ativo) setCarregandoPeriodo(false);
      }
    }

    carregarPeriodo();

    return () => {
      ativo = false;
    };
  }, [periodo]);

  if (erro) {
    return (
      <Layout>
        <ErrorMessage message={erro} />
      </Layout>
    );
  }

  if (!dados) {
    return (
      <Layout>
        <Loading />
      </Layout>
    );
  }

  return (
    <Layout>
      <PageHeader title="Dashboard" subtitle="Resumo geral da academia." />

      {dados.mensalidadesVencidas > 0 && (
        <div className="dashboard-alerta">
          <span>
            ⚠️ {dados.mensalidadesVencidas} mensalidade(s) vencida(s) precisam de atenção.
          </span>

          <Button type="button" variant="secondary" onClick={() => navigate("/mensalidades")}>
            Ver mensalidades
          </Button>
        </div>
      )}

      <section className="dashboard-secao">
        <div className="dashboard-secao-cabecalho">
          <div>
            <h2>Desempenho no Período</h2>
            <p className="dashboard-secao-rubrica">{RUBRICA_PERIODO[periodo]}</p>
          </div>
          <PeriodoSelector valor={periodo} onChange={setPeriodo} />
        </div>

        {carregandoPeriodo && !resumoPeriodo ? (
          <Loading />
        ) : !resumoPeriodo ? (
          <p className="dashboard-vazio">Não foi possível carregar os dados do período.</p>
        ) : (
          <div style={{ opacity: carregandoPeriodo ? 0.6 : 1, transition: "opacity 0.15s ease" }}>
            <div className="dashboard-grid">
              <Card titulo="Receita no Período" valor={formatarMoeda(resumoPeriodo.kpis.receita)} />
              <Card titulo="Presenças no Período" valor={resumoPeriodo.kpis.presencas} />
              <Card titulo="Novos Alunos" valor={resumoPeriodo.kpis.novosAlunos} />
              <Card titulo="Graduações no Período" valor={resumoPeriodo.kpis.graduacoes} />
            </div>

            <div className="dashboard-graficos">
              <BarChart
                titulo="Receita"
                subtitulo="Mensalidades recebidas no período"
                dados={resumoPeriodo.seriesReceita}
                formatarValor={formatarMoeda}
              />
              <BarChart
                titulo="Frequência"
                subtitulo="Presenças registradas no período"
                dados={resumoPeriodo.seriesFrequencia}
              />
              <BarChart
                titulo="Novas Matrículas"
                subtitulo="Alunos cadastrados no período"
                dados={resumoPeriodo.seriesNovasMatriculas}
              />
            </div>
          </div>
        )}
      </section>

      <section className="dashboard-secao">
        <h2>Alunos e Atividades</h2>

        <div className="dashboard-grid">
          <Card titulo="Alunos Ativos" valor={dados.alunosAtivos} />
          <Card titulo="Responsáveis" valor={dados.responsaveis} />
          <Card titulo="Presenças Hoje" valor={dados.presencasHoje} />
          <Card titulo="Graduações" valor={dados.graduacoes} />
          <Card titulo="Competições" valor={dados.competicoes} />
        </div>
      </section>

      <section className="dashboard-secao">
        <h2>Financeiro</h2>

        <div className="dashboard-grid">
          <Card titulo="Total Recebido" valor={`R$ ${dados.totalRecebido.toFixed(2)}`} />
          <Card titulo="Total Pendente" valor={`R$ ${dados.totalPendente.toFixed(2)}`} />
          <Card titulo="Mensalidades Pendentes" valor={dados.mensalidadesPendentes} />
          <Card titulo="Mensalidades Vencidas" valor={dados.mensalidadesVencidas} />
        </div>
      </section>

      <section className="dashboard-secao">
        <h2>Próximas Graduações</h2>

        {proximasGraduacoes.length === 0 ? (
          <p className="dashboard-vazio">Nenhum aluno elegível no momento.</p>
        ) : (
          <div className="dashboard-lista">
            {proximasGraduacoes.slice(0, 5).map((aluno) => (
              <div key={aluno.alunoId} className="dashboard-lista-item">
                <span>{aluno.nome}</span>
                <span>{aluno.faixa}</span>
                <span>{aluno.presencas} aulas</span>
              </div>
            ))}
          </div>
        )}

        <Button type="button" variant="secondary" onClick={() => navigate("/graduacoes/proximas")}>
          Ver todos
        </Button>
      </section>
    </Layout>
  );
}