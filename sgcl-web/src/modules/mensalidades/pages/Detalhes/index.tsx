import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Layout } from "../../../../components/layout/Layout";
import { PageHeader } from "../../../../components/layout/PageHeader";
import { Card } from "../../../../components/ui/Card";
import { Button } from "../../../../components/ui/Button";
import { ErrorMessage } from "../../../../components/ui/ErrorMessage";
import { Loading } from "../../../../components/ui/Loading";
import { StatusBadge } from "../../../../components/ui/StatusBadge";
import { MensalidadeService } from "../../services/MensalidadeService";
import { getApiErrorMessage } from "../../../../shared/utils/getApiErrorMessage";
import { calcularStatusMensalidade } from "../../utils/status";
import type { MensalidadeComAluno } from "../../types";
import "./styles.css";
function formatarData(data: string): string {
  return new Date(data).toLocaleDateString("pt-BR");
}
const STATUS_BADGE = {
  PAGA: "PAGO",
  PENDENTE: "PENDENTE",
  VENCIDA: "VENCIDO",
} as const;
export function DetalheMensalidade() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [mensalidade, setMensalidade] = useState<MensalidadeComAluno | null>(null);
  const [loading, setLoading] = useState(true);
  const [marcandoPago, setMarcandoPago] = useState(false);
  const [erro, setErro] = useState("");
  useEffect(() => {
    async function carregarMensalidade() {
      try {
        if (!id) return;
        const data = await MensalidadeService.buscar(Number(id));
        setMensalidade(data);
      } catch (error) {
        setErro(getApiErrorMessage(error, "Erro ao carregar mensalidade."));
      } finally {
        setLoading(false);
      }
    }
    carregarMensalidade();
  }, [id]);
  async function handleMarcarComoPago() {
    try {
      if (!mensalidade) return;
      setMarcandoPago(true);
      setErro("");
      await MensalidadeService.marcarComoPago(mensalidade.id);
      const dados = await MensalidadeService.buscar(Number(id));
      setMensalidade(dados);
    } catch (error) {
      setErro(getApiErrorMessage(error, "Erro ao marcar como pago."));
    } finally {
      setMarcandoPago(false);
    }
  }
  if (loading) {
    return (
      <Layout>
        <Loading />
      </Layout>
    );
  }
  if (!mensalidade) {
    return (
      <Layout>
        <PageHeader title="Mensalidade" subtitle="Detalhes da mensalidade." />
        <ErrorMessage message={erro || "Mensalidade não encontrada."} />
        <Button type="button" variant="secondary" onClick={() => navigate("/mensalidades")}>
          Voltar
        </Button>
      </Layout>
    );
  }
  const status = calcularStatusMensalidade(mensalidade);
  return (
    <Layout>
      <PageHeader
        title={`Mensalidade - ${mensalidade.aluno?.nome}`}
        subtitle="Detalhes da mensalidade."
      />
      <ErrorMessage message={erro} />
      <div className="mensalidade-detalhe-card">
        <div className="mensalidade-detalhe-header">
          <h2>Detalhes</h2>
          <StatusBadge status={STATUS_BADGE[status]} />
        </div>
        <div className="mensalidade-detalhe-grid">
          <div>
            <p>Aluno</p>
            <strong>{mensalidade.aluno?.nome}</strong>
          </div>
          <div>
            <p>Faixa</p>
            <strong>{mensalidade.aluno?.faixa}</strong>
          </div>
          <div>
            <p>Descrição</p>
            <strong>{mensalidade.descricao || "Mensalidade"}</strong>
          </div>
        </div>
        <div className="mensalidade-detalhe-kpis">
          <Card
            titulo="Valor"
            valor={`R$ ${mensalidade.valor.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          />
          <Card titulo="Vencimento" valor={formatarData(mensalidade.vencimento)} />
          {mensalidade.dataPagamento && (
            <Card titulo="Data de Pagamento" valor={formatarData(mensalidade.dataPagamento)} />
          )}
        </div>
        <p className="mensalidade-detalhe-id">ID da Mensalidade: {mensalidade.id}</p>
        <div className="mensalidade-detalhe-acoes">
          {!mensalidade.pago && status !== "PAGA" && (
            <Button type="button" onClick={handleMarcarComoPago} disabled={marcandoPago}>
              {marcandoPago ? "Marcando..." : "✓ Marcar como Pago"}
            </Button>
          )}
          <Button type="button" variant="secondary" onClick={() => navigate("/mensalidades")}>
            Fechar
          </Button>
        </div>
      </div>
    </Layout>
  );
}