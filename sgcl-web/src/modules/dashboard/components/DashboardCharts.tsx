import { BarChart } from "../../../components/ui/BarChart";
import { MultiSeriesChart } from "../../../components/ui/MultiSeriesChart";
import { formatarMoeda, formatarPercentual } from "../utils/formatters";
import type { DashboardResumoPeriodo } from "../types";

interface DashboardChartsProps {
  resumo: DashboardResumoPeriodo;
}

// RN do dashboard: "Receita" (recebido/previsto/pendente) e "Financeiro"
// (recebido/pendente/vencido) do pedido original foram consolidados num
// único gráfico financeiro — os dois cobriam quase os mesmos números, e a
// instrução de "evitar repetir o mesmo indicador em várias seções" vale
// também entre gráficos.
export function DashboardCharts({ resumo }: DashboardChartsProps) {
  return (
    <div className="dashboard-graficos">
      <MultiSeriesChart
        titulo="Financeiro"
        subtitulo="Recebido, previsto, pendente e vencido no período"
        dados={resumo.seriesReceita}
        formatarValor={formatarMoeda}
        barras={[
          { chave: "recebido", rotulo: "Recebido", cor: "var(--color-success)" },
          { chave: "previsto", rotulo: "Previsto", cor: "var(--color-accent)" },
          { chave: "pendente", rotulo: "Pendente", cor: "var(--color-warning)" },
          { chave: "vencido", rotulo: "Vencido", cor: "var(--color-danger)" },
        ]}
      />

      <MultiSeriesChart
        titulo="Matrículas"
        subtitulo="Novas matrículas, cancelamentos e saldo líquido"
        dados={resumo.seriesMatriculas}
        barras={[
          { chave: "novasMatriculas", rotulo: "Novas matrículas", cor: "var(--color-success)" },
          { chave: "cancelamentos", rotulo: "Cancelamentos", cor: "var(--color-danger)" },
          { chave: "saldo", rotulo: "Saldo líquido", cor: "var(--color-accent)" },
        ]}
      />

      <MultiSeriesChart
        titulo="Frequência"
        subtitulo="Presenças, faltas e taxa de frequência no período"
        dados={resumo.seriesFrequencia}
        barras={[
          { chave: "presencas", rotulo: "Presenças", cor: "var(--color-accent)" },
          { chave: "faltas", rotulo: "Faltas", cor: "var(--color-danger)" },
        ]}
        linha={{ chave: "taxaFrequencia", rotulo: "Taxa de frequência", formatarValor: formatarPercentual }}
      />

      <BarChart
        titulo="Evolução de Alunos Ativos"
        subtitulo="Total de alunos ativos ao longo do período"
        dados={resumo.seriesAlunosAtivos.map((ponto) => ({ rotulo: ponto.label, valor: ponto.valor }))}
      />
    </div>
  );
}
