import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { Layout } from "../../../../components/layout/Layout";
import { PageHeader } from "../../../../components/layout/PageHeader";
import { Button } from "../../../../components/ui/Button";
import { ErrorMessage } from "../../../../components/ui/ErrorMessage";
import { Loading } from "../../../../components/ui/Loading";
import { Select } from "../../../../components/ui/Select";
import { Tabs } from "../../../../components/ui/Tabs";
import { PeriodoSelector } from "../../../../components/ui/PeriodoSelector";
import { MultiSeriesChart } from "../../../../components/ui/MultiSeriesChart";
import { EmptyState } from "../../../../components/ui/EmptyState";

import { useAuth } from "../../../../contexts/useAuth";
import { useFinanceiroDashboard } from "../../hooks/useFinanceiroDashboard";
import { FinanceiroService } from "../../services/FinanceiroService";
import { UnidadeService } from "../../../unidades/services/UnidadeService";
import { UsuarioService } from "../../../usuarios/services/UsuarioService";
import { DashboardKpiCard } from "../../../dashboard/components/DashboardKpiCard";
import { DashboardSection } from "../../../dashboard/components/DashboardSection";
import { DashboardSectionError } from "../../../dashboard/components/DashboardSectionError";
import { formatarMoeda, formatarPercentual, formatarData } from "../../../dashboard/utils/formatters";
import { getApiErrorMessage } from "../../../../shared/utils/getApiErrorMessage";
import { ContasTable } from "../../components/ContasTable";

import type { Unidade } from "../../../unidades/types/unidade";
import type { ProfessorOpcao } from "../../../usuarios/types/usuario";
import type { TipoExportacaoFinanceiro } from "../../services/FinanceiroService";

import "./styles.css";

export function Financeiro() {
  const navigate = useNavigate();
  const { usuario } = useAuth();
  const ehSuperadmin = usuario?.perfil === "SUPERADMIN";

  const {
    periodo,
    definirPeriodo,
    unidadeId,
    definirUnidadeId,
    professorId,
    definirProfessorId,
    filtros,
    dashboard,
    fluxoCaixa,
    contasAReceber,
    contasPagas,
    contasVencidas,
    canceladas,
    estornos,
    recarregarDashboard,
    recarregarFluxoCaixa,
    recarregarContasAReceber,
    recarregarContasPagas,
    recarregarContasVencidas,
    recarregarCanceladas,
    recarregarEstornos,
  } = useFinanceiroDashboard();

  const [unidades, setUnidades] = useState<Unidade[]>([]);
  const [professores, setProfessores] = useState<ProfessorOpcao[]>([]);
  const [exportando, setExportando] = useState<TipoExportacaoFinanceiro | null>(null);
  const [erroExportar, setErroExportar] = useState("");

  useEffect(() => {
    if (ehSuperadmin) {
      UnidadeService.listar().then(setUnidades).catch(() => setUnidades([]));
    }
    UsuarioService.listarProfessores().then(setProfessores).catch(() => setProfessores([]));
  }, [ehSuperadmin]);

  async function handleExportar(tipo: TipoExportacaoFinanceiro) {
    try {
      setExportando(tipo);
      setErroExportar("");

      const blob = await FinanceiroService.exportar(tipo, filtros);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `financeiro-${tipo.toLowerCase()}.csv`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      setErroExportar(getApiErrorMessage(error, "Erro ao exportar o relatório."));
    } finally {
      setExportando(null);
    }
  }

  const kpis = dashboard.dados;

  return (
    <Layout>
      <PageHeader title="Financeiro" subtitle="Contas a receber, contas pagas, fluxo de caixa e inadimplência." />

      <div className="financeiro-toolbar">
        <div className="financeiro-toolbar-filtros">
          <PeriodoSelector valor={periodo} onChange={definirPeriodo} />

          {ehSuperadmin && (
            <Select
              label="Unidade (todas, se em branco)"
              options={unidades.map((u) => ({ label: u.nome, value: String(u.id) }))}
              value={unidadeId ? String(unidadeId) : ""}
              onChange={(e) => definirUnidadeId(e.target.value ? Number(e.target.value) : undefined)}
            />
          )}

          <Select
            label="Professor (todos, se em branco)"
            options={professores.map((p) => ({ label: p.apelido || p.nome, value: String(p.id) }))}
            value={professorId ? String(professorId) : ""}
            onChange={(e) => definirProfessorId(e.target.value ? Number(e.target.value) : undefined)}
          />
        </div>

        <div className="financeiro-toolbar-acoes">
          <Button type="button" variant="secondary" onClick={() => navigate("/financeiro/formas-pagamento")}>
            Formas de Pagamento
          </Button>
          <Button type="button" onClick={() => navigate("/mensalidades/novo")}>
            + Nova Mensalidade
          </Button>
        </div>
      </div>

      <DashboardSection titulo="Indicadores" subtitulo="Resumo financeiro do período e filtros selecionados.">
        {dashboard.carregando && !kpis ? (
          <Loading />
        ) : dashboard.erro ? (
          <DashboardSectionError mensagem={dashboard.erro} onTentarNovamente={recarregarDashboard} />
        ) : !kpis ? null : (
          <div className="financeiro-kpis">
            <DashboardKpiCard titulo="Receita Prevista" valor={formatarMoeda(kpis.receitaPrevista)} />
            <DashboardKpiCard titulo="Receita Recebida" valor={formatarMoeda(kpis.receitaRecebida)} />
            <DashboardKpiCard
              titulo="Receita Recorrente"
              valor={formatarMoeda(kpis.receitaRecorrente)}
              complemento="Cobrança recorrente é a próxima fase do módulo."
            />
            <DashboardKpiCard titulo="Ticket Médio" valor={formatarMoeda(kpis.ticketMedio)} semDados={kpis.ticketMedio === 0} />
            <DashboardKpiCard titulo="Taxa de Inadimplência" valor={formatarPercentual(kpis.taxaInadimplencia)} />
            <DashboardKpiCard titulo="Mensalidades Vencidas" valor={String(kpis.mensalidadesVencidas)} />
            <DashboardKpiCard titulo="Mensalidades Pagas" valor={String(kpis.mensalidadesPagas)} />
            <DashboardKpiCard
              titulo="Cobranças Recorrentes Ativas"
              valor={String(kpis.cobrancasRecorrentesAtivas)}
              complemento="Disponível quando a cobrança recorrente for implementada."
            />
          </div>
        )}
      </DashboardSection>

      <DashboardSection titulo="Fluxo de Caixa" subtitulo="Recebido x previsto no período selecionado.">
        {fluxoCaixa.carregando && !fluxoCaixa.dados ? (
          <Loading />
        ) : fluxoCaixa.erro ? (
          <DashboardSectionError mensagem={fluxoCaixa.erro} onTentarNovamente={recarregarFluxoCaixa} />
        ) : fluxoCaixa.dados ? (
          <MultiSeriesChart
            titulo="Fluxo de Caixa"
            dados={fluxoCaixa.dados.map((ponto) => ({ label: ponto.rotulo, recebido: ponto.recebido, previsto: ponto.previsto }))}
            formatarValor={formatarMoeda}
            barras={[
              { chave: "recebido", rotulo: "Recebido", cor: "var(--color-success)" },
              { chave: "previsto", rotulo: "Previsto", cor: "var(--color-accent)" },
            ]}
          />
        ) : null}
      </DashboardSection>

      {kpis && (kpis.receitaPorUnidade.length > 0 || kpis.receitaPorProfessor.length > 0) && (
        <DashboardSection titulo="Receita por Unidade e por Professor" subtitulo="Receita recebida no período, agrupada.">
          <div className="financeiro-agrupamentos">
            {kpis.receitaPorUnidade.length > 0 && (
              <div className="financeiro-agrupamento-card">
                <h3>Por Unidade</h3>
                <ul>
                  {kpis.receitaPorUnidade.map((item) => (
                    <li key={item.unidadeId}>
                      <span>{item.unidade}</span>
                      <strong>{formatarMoeda(item.valor)}</strong>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {kpis.receitaPorProfessor.length > 0 && (
              <div className="financeiro-agrupamento-card">
                <h3>Por Professor</h3>
                <ul>
                  {kpis.receitaPorProfessor.map((item) => (
                    <li key={item.professorId}>
                      <span>{item.professor}</span>
                      <strong>{formatarMoeda(item.valor)}</strong>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </DashboardSection>
      )}

      {kpis && (
        <DashboardSection titulo="Próximos Vencimentos" subtitulo="Cobranças em aberto mais próximas do vencimento.">
          {kpis.proximosVencimentos.length === 0 ? (
            <EmptyState title="Nenhum vencimento próximo" description="Não há cobranças em aberto no momento." />
          ) : (
            <ul className="financeiro-proximos-vencimentos">
              {kpis.proximosVencimentos.map((item) => (
                <li key={item.id}>
                  <span>{item.aluno}</span>
                  <span>{formatarData(item.vencimento)}</span>
                  <strong>{formatarMoeda(item.valorFinal)}</strong>
                </li>
              ))}
            </ul>
          )}
        </DashboardSection>
      )}

      <ErrorMessage message={erroExportar} />

      <div className="financeiro-contas">
        <Tabs
          defaultValue="receber"
          tabs={[
            {
              value: "receber",
              label: "Contas a Receber",
              content: (
                <ContaAba
                  secao={contasAReceber}
                  onRecarregar={recarregarContasAReceber}
                  onExportar={() => handleExportar("RECEBER")}
                  exportando={exportando === "RECEBER"}
                  emptyTitle="Nenhuma conta a receber"
                  emptyDescription="Todas as mensalidades do período estão pagas, canceladas ou estornadas."
                />
              ),
            },
            {
              value: "pagas",
              label: "Contas Pagas",
              content: (
                <ContaAba
                  secao={contasPagas}
                  onRecarregar={recarregarContasPagas}
                  onExportar={() => handleExportar("PAGAS")}
                  exportando={exportando === "PAGAS"}
                  emptyTitle="Nenhuma conta paga"
                  emptyDescription="Nenhum pagamento confirmado no período selecionado."
                />
              ),
            },
            {
              value: "vencidas",
              label: "Contas Vencidas",
              content: (
                <ContaAba
                  secao={contasVencidas}
                  onRecarregar={recarregarContasVencidas}
                  onExportar={() => handleExportar("VENCIDAS")}
                  exportando={exportando === "VENCIDAS"}
                  emptyTitle="Nenhuma conta vencida"
                  emptyDescription="Todos os pagamentos estão em dia."
                />
              ),
            },
            {
              value: "canceladas",
              label: "Canceladas",
              content: (
                <ContaAba
                  secao={canceladas}
                  onRecarregar={recarregarCanceladas}
                  onExportar={() => handleExportar("CANCELADAS")}
                  exportando={exportando === "CANCELADAS"}
                  emptyTitle="Nenhuma cobrança cancelada"
                  emptyDescription="Nenhuma mensalidade foi cancelada no período."
                />
              ),
            },
            {
              value: "estornos",
              label: "Estornos",
              content: (
                <ContaAba
                  secao={estornos}
                  onRecarregar={recarregarEstornos}
                  onExportar={() => handleExportar("ESTORNOS")}
                  exportando={exportando === "ESTORNOS"}
                  emptyTitle="Nenhum estorno"
                  emptyDescription="Nenhuma mensalidade foi estornada no período."
                />
              ),
            },
          ]}
        />
      </div>
    </Layout>
  );
}

interface SecaoContas {
  dados: import("../../../mensalidades/types").MensalidadeComAluno[] | null;
  carregando: boolean;
  erro: string;
}

interface ContaAbaProps {
  secao: SecaoContas;
  onRecarregar: () => void;
  onExportar: () => void;
  exportando: boolean;
  emptyTitle: string;
  emptyDescription: string;
}

function ContaAba({ secao, onRecarregar, onExportar, exportando, emptyTitle, emptyDescription }: ContaAbaProps) {
  return (
    <div className="financeiro-conta-aba">
      <div className="financeiro-conta-aba-acoes">
        <Button type="button" variant="secondary" size="sm" disabled={exportando || !secao.dados?.length} onClick={onExportar}>
          {exportando ? "Exportando..." : "Exportar CSV"}
        </Button>
      </div>

      {secao.carregando && !secao.dados ? (
        <Loading />
      ) : secao.erro ? (
        <DashboardSectionError mensagem={secao.erro} onTentarNovamente={onRecarregar} />
      ) : (
        <ContasTable contas={secao.dados ?? []} emptyTitle={emptyTitle} emptyDescription={emptyDescription} />
      )}
    </div>
  );
}
