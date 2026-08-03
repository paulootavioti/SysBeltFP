import { useNavigate } from "react-router-dom";

import { Layout } from "../../components/layout/Layout";
import { PageHeader } from "../../components/layout/PageHeader";
import { Loading } from "../../components/ui/Loading";
import { PeriodoSelector } from "../../components/ui/PeriodoSelector";
import { Button } from "../../components/ui/Button";

import { useDashboard } from "../../modules/dashboard/hooks/useDashboard";
import { DashboardSection } from "../../modules/dashboard/components/DashboardSection";
import { DashboardSectionError } from "../../modules/dashboard/components/DashboardSectionError";
import { DashboardKpiCard } from "../../modules/dashboard/components/DashboardKpiCard";
import { DashboardCharts } from "../../modules/dashboard/components/DashboardCharts";
import { DashboardGoals } from "../../modules/dashboard/components/DashboardGoals";
import { DashboardAlertList } from "../../modules/dashboard/components/DashboardAlertList";
import { DashboardEvents } from "../../modules/dashboard/components/DashboardEvents";
import { DashboardGraduations } from "../../modules/dashboard/components/DashboardGraduations";
import { DashboardUnits } from "../../modules/dashboard/components/DashboardUnits";
import { mesclarAlertas } from "../../modules/dashboard/utils/alertasComplementares";
import { formatarDecimal, formatarMoeda, formatarPercentual } from "../../modules/dashboard/utils/formatters";
import type { PeriodoOpcao } from "../../modules/dashboard/types";

import "./styles.css";

const RUBRICA_PERIODO: Record<PeriodoOpcao, string> = {
  DIARIO: "Hoje, por hora",
  SEMANAL: "Últimos 7 dias",
  MENSAL: "Este mês, por semana",
  ANUAL: "Este ano, por mês",
};

export function Dashboard() {
  const navigate = useNavigate();
  const {
    periodo,
    definirPeriodo,
    resumoPeriodo,
    unidades,
    alertas,
    graduacoes,
    metas,
    eventos,
    loja,
    podeVerLoja,
    recarregarResumoPeriodo,
    recarregarUnidades,
    recarregarAlertas,
    recarregarGraduacoes,
    recarregarMetas,
    recarregarEventos,
    recarregarLoja,
  } = useDashboard();

  const kpis = resumoPeriodo.dados?.kpis;

  const alertasCompletos = mesclarAlertas(alertas.dados ?? [], metas.dados ?? [], eventos.dados ?? []);

  return (
    <Layout>
      <PageHeader title="Dashboard" subtitle="Painel executivo da academia." />

      <div className="dashboard-filtro-periodo">
        <div>
          <p className="dashboard-secao-rubrica">{RUBRICA_PERIODO[periodo]}</p>
        </div>
        <PeriodoSelector valor={periodo} onChange={definirPeriodo} />
      </div>

      <DashboardSection titulo="Visão Executiva" subtitulo="Principais números do período selecionado.">
        {resumoPeriodo.carregando && !kpis ? (
          <Loading />
        ) : resumoPeriodo.erro ? (
          <DashboardSectionError mensagem={resumoPeriodo.erro} onTentarNovamente={recarregarResumoPeriodo} />
        ) : !kpis ? null : (
          <div className="dashboard-grid" style={{ opacity: resumoPeriodo.carregando ? 0.6 : 1 }}>
            <DashboardKpiCard
              titulo="Receita no Período"
              valor={formatarMoeda(kpis.receita)}
              complemento={`Média de ${formatarMoeda(kpis.receitaMedia)} ${kpis.unidadeMediaNovasMatriculas}`}
              variacao={kpis.variacaoReceita}
            />

            <DashboardKpiCard
              titulo="Ticket Médio"
              valor={`${formatarMoeda(kpis.ticketMedio)} por aluno`}
              complemento={`${kpis.alunosPagantes} aluno(s) pagante(s) no período`}
              semDados={kpis.alunosPagantes === 0}
            />

            <DashboardKpiCard
              titulo="Alunos Ativos"
              valor={String(kpis.alunosAtivos)}
              complemento="Total de alunos ativos hoje"
              variacao={kpis.variacaoAlunosAtivos}
            />

            <DashboardKpiCard
              titulo="Novas Matrículas"
              valor={String(kpis.novosAlunos)}
              complemento={`${kpis.cancelamentos} cancelamento(s) • saldo ${kpis.saldoAlunos >= 0 ? "+" : ""}${kpis.saldoAlunos}`}
              variacao={kpis.variacaoNovasMatriculas}
            />

            <DashboardKpiCard
              titulo="Média de Novas Matrículas"
              valor={`${formatarDecimal(kpis.mediaNovasMatriculas)} ${kpis.unidadeMediaNovasMatriculas}`}
            />

            <DashboardKpiCard
              titulo="Taxa de Frequência"
              valor={formatarPercentual(kpis.taxaFrequencia)}
              complemento={`${kpis.presencas} de ${kpis.presencasEsperadas} presenças esperadas`}
              variacao={kpis.variacaoFrequencia}
              semDados={kpis.presencasEsperadas === 0}
            />

            <DashboardKpiCard
              titulo="Mensalidades Vencidas"
              valor={String(kpis.mensalidadesVencidas)}
              complemento={`${formatarPercentual(kpis.taxaInadimplencia)} de inadimplência no período`}
            />

            <DashboardKpiCard titulo="Graduações Realizadas" valor={String(kpis.graduacoes)} />
          </div>
        )}
      </DashboardSection>

      <DashboardSection titulo="Gráficos de Desempenho" subtitulo="Reagem ao período selecionado acima.">
        {resumoPeriodo.carregando && !resumoPeriodo.dados ? (
          <Loading />
        ) : resumoPeriodo.erro ? (
          <DashboardSectionError mensagem={resumoPeriodo.erro} onTentarNovamente={recarregarResumoPeriodo} />
        ) : resumoPeriodo.dados ? (
          <DashboardCharts resumo={resumoPeriodo.dados} />
        ) : null}
      </DashboardSection>

      <DashboardSection titulo="Metas do Período" subtitulo="Acompanhamento dos objetivos estratégicos.">
        {metas.carregando ? (
          <Loading />
        ) : metas.erro ? (
          <DashboardSectionError mensagem={metas.erro} onTentarNovamente={recarregarMetas} />
        ) : (
          <DashboardGoals metas={metas.dados ?? []} />
        )}
      </DashboardSection>

      <DashboardSection titulo="Atenção do Gestor" subtitulo="O que exige uma ação agora.">
        {alertas.carregando ? (
          <Loading />
        ) : alertas.erro ? (
          <DashboardSectionError mensagem={alertas.erro} onTentarNovamente={recarregarAlertas} />
        ) : (
          <DashboardAlertList alertas={alertasCompletos} />
        )}
      </DashboardSection>

      <DashboardSection titulo="Campanhas e Seminários" subtitulo="Eventos ativos e próximos.">
        {eventos.carregando ? (
          <Loading />
        ) : eventos.erro ? (
          <DashboardSectionError mensagem={eventos.erro} onTentarNovamente={recarregarEventos} />
        ) : (
          <DashboardEvents eventos={eventos.dados ?? []} />
        )}
      </DashboardSection>

      <DashboardSection titulo="Próximas Graduações" subtitulo="Alunos perto de evoluir de faixa ou grau.">
        {graduacoes.carregando ? (
          <Loading />
        ) : graduacoes.erro ? (
          <DashboardSectionError mensagem={graduacoes.erro} onTentarNovamente={recarregarGraduacoes} />
        ) : (
          <DashboardGraduations alunos={graduacoes.dados ?? []} />
        )}
      </DashboardSection>

      {podeVerLoja && (
        <DashboardSection
          titulo="Loja"
          subtitulo="Catálogo de produtos e estoque."
          acao={
            <Button type="button" variant="secondary" size="sm" onClick={() => navigate("/loja")}>
              Ver loja
            </Button>
          }
        >
          {loja.carregando && !loja.dados ? (
            <Loading />
          ) : loja.erro ? (
            <DashboardSectionError mensagem={loja.erro} onTentarNovamente={recarregarLoja} />
          ) : loja.dados ? (
            <div className="dashboard-grid">
              <DashboardKpiCard titulo="Produtos ativos" valor={String(loja.dados.produtosAtivos)} />
              <DashboardKpiCard titulo="Unidades em estoque" valor={String(loja.dados.unidadesEmEstoque)} />
              <DashboardKpiCard
                titulo="Produtos com estoque baixo"
                valor={String(loja.dados.produtosComEstoqueBaixo)}
              />
              <DashboardKpiCard titulo="Valor total em estoque" valor={formatarMoeda(loja.dados.valorTotalEstoque)} />
            </div>
          ) : null}
        </DashboardSection>
      )}

      <DashboardSection titulo="Unidades e Arenas" subtitulo="Situação operacional de cada unidade.">
        {unidades.carregando && !unidades.dados ? (
          <Loading />
        ) : unidades.erro ? (
          <DashboardSectionError mensagem={unidades.erro} onTentarNovamente={recarregarUnidades} />
        ) : (
          <DashboardUnits unidades={unidades.dados ?? []} eventos={eventos.dados ?? []} />
        )}
      </DashboardSection>
    </Layout>
  );
}
