import { Layout } from "../../../../components/layout/Layout";
import { PageHeader } from "../../../../components/layout/PageHeader";
import { ErrorMessage } from "../../../../components/ui/ErrorMessage";
import { Loading } from "../../../../components/ui/Loading";
import { EmptyState } from "../../../../components/ui/EmptyState";
import { Table } from "../../../../components/ui/Table";
import { StatusBadge } from "../../../../components/ui/StatusBadge";
import { formatarData } from "../../../../shared/utils/formatarData";
import { useMinhaAssinatura } from "../../hooks/useMinhaAssinatura";
import {
  RECURSO_LABEL,
  STATUS_ASSINATURA_LABEL,
  formatarCentavos,
  type FaturaPlataforma,
  type RecursoPlataforma,
} from "../../types";
import "./styles.css";

// Competência é MÊS, e mês é data de calendário: lido em UTC, como o resto
// das datas que o usuário preencheu num calendário (ver
// shared/utils/formatarData.ts). Formatar no fuso do navegador faria
// "agosto" virar "julho" pra quem está a oeste de Greenwich.
function formatarCompetencia(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

const STATUS_FATURA_BADGE = {
  ABERTA: "PENDENTE",
  PAGA: "PAGO",
  CANCELADA: "CANCELADO",
} as const;

export function MinhaAssinatura() {
  const { assinatura, loading, erro } = useMinhaAssinatura();

  if (loading) {
    return (
      <Layout>
        <PageHeader title="Minha assinatura" />
        <Loading />
      </Layout>
    );
  }

  if (erro || !assinatura) {
    return (
      <Layout>
        <PageHeader title="Minha assinatura" />
        <ErrorMessage message={erro || "Não foi possível carregar a assinatura."} />
      </Layout>
    );
  }

  const { plano, previaDoMes, faturas } = assinatura;

  const colunas = [
    {
      header: "Competência",
      accessor: "competencia" as keyof FaturaPlataforma,
      render: (fatura: FaturaPlataforma) => formatarCompetencia(fatura.competencia),
    },
    {
      header: "Alunos",
      accessor: "alunosContados" as keyof FaturaPlataforma,
      render: (fatura: FaturaPlataforma) =>
        `${fatura.alunosContados} (${fatura.blocos} ${fatura.blocos === 1 ? "faixa" : "faixas"})`,
    },
    {
      header: "Valor",
      accessor: "valorCentavos" as keyof FaturaPlataforma,
      render: (fatura: FaturaPlataforma) => formatarCentavos(fatura.valorCentavos),
    },
    {
      header: "Vencimento",
      accessor: "vencimento" as keyof FaturaPlataforma,
      render: (fatura: FaturaPlataforma) => formatarData(fatura.vencimento),
    },
    {
      header: "Situação",
      accessor: "status" as keyof FaturaPlataforma,
      render: (fatura: FaturaPlataforma) => (
        <StatusBadge status={STATUS_FATURA_BADGE[fatura.status]} />
      ),
    },
  ];

  return (
    <Layout>
      <PageHeader title="Minha assinatura" subtitle={assinatura.conta.nome} />

      <div className="assinatura-cartoes">
        <section className="assinatura-cartao assinatura-cartao--destaque">
          <span className="assinatura-rotulo">Previsto para este mês</span>
          <strong className="assinatura-valor">
            {formatarCentavos(previaDoMes.valorCentavos)}
          </strong>
          <p className="assinatura-detalhe">
            {previaDoMes.alunosContados}{" "}
            {previaDoMes.alunosContados === 1 ? "aluno ativo" : "alunos ativos"} ·{" "}
            {previaDoMes.blocos} {previaDoMes.blocos === 1 ? "faixa" : "faixas"} de{" "}
            {plano.alunosPorBloco} a {formatarCentavos(plano.precoPorBlocoCentavos)}
          </p>
          <p className="assinatura-detalhe assinatura-detalhe--fraco">
            Vence em {formatarData(previaDoMes.vencimento)}
          </p>
          {previaDoMes.unidades.map((unidade) => (
            <p className="assinatura-detalhe assinatura-detalhe--fraco" key={unidade.unidadeId}>
              {unidade.nomeUnidade}: {unidade.alunosContados} aluno(s), {unidade.blocos}{" "}
              {unidade.blocos === 1 ? "faixa" : "faixas"} — {formatarCentavos(unidade.valorCentavos)}
            </p>
          ))}
        </section>

        <section className="assinatura-cartao">
          <span className="assinatura-rotulo">Plano</span>
          <strong className="assinatura-plano">{plano.nome}</strong>
          {plano.descricao && <p className="assinatura-detalhe">{plano.descricao}</p>}
          <p className="assinatura-detalhe">
            Situação: {STATUS_ASSINATURA_LABEL[assinatura.status]}
          </p>
          {assinatura.status === "TESTE" && assinatura.fimTesteEm && (
            <p className="assinatura-detalhe assinatura-detalhe--aviso">
              Teste até {formatarData(assinatura.fimTesteEm)}
            </p>
          )}
        </section>

        <section className="assinatura-cartao">
          <span className="assinatura-rotulo">Licenças ativas</span>
          <strong className="assinatura-valor">{previaDoMes.unidades.length}</strong>
          <p className="assinatura-detalhe">
            Cada unidade é calculada separadamente e paga ao menos uma faixa.
          </p>
        </section>
      </div>

      {plano.recursos.length > 0 && (
        <section className="assinatura-recursos">
          <span className="assinatura-rotulo">Incluído no seu plano</span>
          <ul>
            {plano.recursos.map((recurso) => (
              <li key={recurso}>
                {RECURSO_LABEL[recurso as RecursoPlataforma] ?? recurso}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="assinatura-faturas">
        <h2>Faturas</h2>

        {faturas.length === 0 ? (
          <EmptyState
            title="Nenhuma fatura emitida ainda"
            description="A primeira sai no fechamento do mês."
          />
        ) : (
          <Table columns={colunas} data={faturas} />
        )}
      </section>
    </Layout>
  );
}
