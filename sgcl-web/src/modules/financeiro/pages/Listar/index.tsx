import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { Layout } from "../../../../components/layout/Layout";
import { PageHeader } from "../../../../components/layout/PageHeader";
import { Card } from "../../../../components/ui/Card";
import { Button } from "../../../../components/ui/Button";
import { ErrorMessage } from "../../../../components/ui/ErrorMessage";
import { Table } from "../../../../components/ui/Table";
import { EmptyState } from "../../../../components/ui/EmptyState";
import { Loading } from "../../../../components/ui/Loading";

import { FinanceiroService, type FinanceiroResumo } from "../../services/FinanceiroService";
import { MensalidadeService } from "../../../mensalidades/services/MensalidadeService";
import { getApiErrorMessage } from "../../../../shared/utils/getApiErrorMessage";
import type { MensalidadeComAluno } from "../../../mensalidades/types";

import "./styles.css";

function formatarData(data: string): string {
  return new Date(data).toLocaleDateString("pt-BR");
}

function diasEmAtraso(vencimento: string): number {
  return Math.floor(
    (Date.now() - new Date(vencimento).getTime()) / (1000 * 60 * 60 * 24)
  );
}

export function Financeiro() {
  const navigate = useNavigate();

  const [resumo, setResumo] = useState<FinanceiroResumo | null>(null);
  const [vencidas, setVencidas] = useState<MensalidadeComAluno[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");

  async function carregarDados() {
    try {
      setLoading(true);
      setErro("");

      const [dadosResumo, dadosVencidas] = await Promise.all([
        FinanceiroService.resumo(),
        MensalidadeService.listarVencidas(),
      ]);

      setResumo(dadosResumo);
      setVencidas(dadosVencidas);
    } catch (error) {
      setErro(getApiErrorMessage(error, "Erro ao carregar financeiro."));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregarDados();
  }, []);

  async function handleMarcarComoPago(id: number) {
    try {
      setErro("");
      await MensalidadeService.marcarComoPago(id);
      await carregarDados();
    } catch (error) {
      setErro(getApiErrorMessage(error, "Erro ao marcar como pago."));
    }
  }

  const columns = [
    {
      header: "Aluno",
      accessor: "aluno" as const,
      render: (mensalidade: MensalidadeComAluno) => mensalidade.aluno?.nome,
    },
    {
      header: "Valor",
      accessor: "valor" as const,
      render: (mensalidade: MensalidadeComAluno) =>
        `R$ ${mensalidade.valor.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    },
    {
      header: "Vencimento",
      accessor: "vencimento" as const,
      render: (mensalidade: MensalidadeComAluno) => formatarData(mensalidade.vencimento),
    },
    {
      header: "Dias em atraso",
      accessor: "id" as const,
      render: (mensalidade: MensalidadeComAluno) => `${diasEmAtraso(mensalidade.vencimento)} dias`,
    },
    {
      header: "Ações",
      accessor: "alunoId" as const,
      render: (mensalidade: MensalidadeComAluno) => (
        <Button type="button" onClick={() => handleMarcarComoPago(mensalidade.id)}>
          Marcar como Pago
        </Button>
      ),
    },
  ];

  if (loading) {
    return (
      <Layout>
        <Loading />
      </Layout>
    );
  }

  return (
    <Layout>
      <PageHeader title="Financeiro" subtitle="Fluxo de caixa e inadimplência." />

      <ErrorMessage message={erro} />

      {resumo && (
        <div className="financeiro-kpis">
          <Card
            titulo="Total Recebido"
            valor={`R$ ${resumo.totalRecebido.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          />
          <Card
            titulo="Total Pendente"
            valor={`R$ ${resumo.totalPendente.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          />
          <Card titulo="Alunos Inadimplentes" valor={resumo.inadimplentes} />
        </div>
      )}

      <div className="financeiro-secao-header">
        <h2>Mensalidades Vencidas</h2>
        <Button type="button" variant="secondary" onClick={() => navigate("/mensalidades")}>
          Ver todas as mensalidades
        </Button>
      </div>

      {vencidas.length === 0 ? (
        <EmptyState
          title="Nenhuma mensalidade vencida"
          description="Todos os pagamentos estão em dia."
        />
      ) : (
        <Table columns={columns} data={vencidas} />
      )}
    </Layout>
  );
}