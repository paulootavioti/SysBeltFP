import { Layout } from "../../../../components/layout/Layout";
import { PageHeader } from "../../../../components/layout/PageHeader";

import { RelatorioCard } from "../../components/RelatorioCard";
import { RelatorioService } from "../../services/RelatorioService";

import "./styles.css";

export function Relatorios() {
  return (
    <Layout>
      <PageHeader
        title="Relatórios"
        subtitle="Gere relatórios em texto para compartilhar com a equipe."
      />

      <div className="relatorios-grid">
        <RelatorioCard
          titulo="Financeiro"
          descricao="Mensalidades vencidas e total em aberto."
          aoGerar={async () => (await RelatorioService.financeiro()).mensagem}
        />

        <RelatorioCard
          titulo="Ranking de Frequência"
          descricao="Alunos com mais presenças registradas."
          aoGerar={async () => (await RelatorioService.ranking()).mensagem}
        />

        <RelatorioCard
          titulo="Aniversariantes do Mês"
          descricao="Alunos ativos que fazem aniversário este mês."
          aoGerar={async () => (await RelatorioService.aniversariantes()).mensagem}
        />

        <RelatorioCard
          titulo="Evolução do Aluno"
          descricao="Faixa, grau e presenças de um aluno específico."
          requerAluno
          aoGerar={async (alunoId) => (await RelatorioService.evolucao(alunoId!)).mensagem}
        />

        <RelatorioCard
          titulo="Comportamental"
          descricao="Indicadores comportamentais acumulados de um aluno."
          requerAluno
          aoGerar={async (alunoId) => (await RelatorioService.comportamental(alunoId!)).mensagem}
        />
      </div>
    </Layout>
  );
}