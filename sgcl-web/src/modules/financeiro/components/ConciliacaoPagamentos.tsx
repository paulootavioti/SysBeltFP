import { useEffect, useState } from "react";
import { FiRefreshCw, FiRotateCw } from "react-icons/fi";
import { Badge } from "../../../components/ui/Badge";
import { Button } from "../../../components/ui/Button";
import { EmptyState } from "../../../components/ui/EmptyState";
import { ErrorMessage } from "../../../components/ui/ErrorMessage";
import { Loading } from "../../../components/ui/Loading";
import { Table } from "../../../components/ui/Table";
import { useToast } from "../../../contexts/toast/useToast";
import { getApiErrorMessage } from "../../../shared/utils/getApiErrorMessage";
import { formatarData, formatarMoeda } from "../../dashboard/utils/formatters";
import { FinanceiroService } from "../services/FinanceiroService";
import type { CobrancaPagamento } from "../types";

const VARIANTE: Record<string, "success" | "danger" | "warning" | "info" | "neutral"> = {
  PAGO: "success", approved: "success", FALHA: "danger", RECUSADO: "danger",
  PENDENTE: "warning", pending: "warning", CRIANDO: "info", ESTORNADO: "neutral",
};

export function ConciliacaoPagamentos() {
  const toast = useToast();
  const [dados, setDados] = useState<CobrancaPagamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [processando, setProcessando] = useState<number | null>(null);
  const [erro, setErro] = useState("");

  async function carregar() {
    try {
      setErro("");
      setDados(await FinanceiroService.conciliacao());
    } catch (error) {
      setErro(getApiErrorMessage(error, "Erro ao carregar a conciliação."));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void carregar(); }, []);

  async function executar(item: CobrancaPagamento, retry: boolean) {
    try {
      setProcessando(item.id);
      if (retry) await FinanceiroService.tentarNovamente(item.id);
      else await FinanceiroService.reconciliar(item.id);
      toast.success(retry ? "Nova tentativa criada." : "Cobrança conciliada.");
      await carregar();
    } catch (error) {
      const mensagem = getApiErrorMessage(error, "Não foi possível processar a cobrança.");
      setErro(mensagem);
      toast.error(mensagem);
    } finally {
      setProcessando(null);
    }
  }

  if (loading) return <Loading />;

  return <div className="conciliacao-pagamentos">
    <ErrorMessage message={erro} />
    {dados.length === 0 ? <EmptyState title="Nenhuma tentativa de pagamento" description="Os pagamentos iniciados no Portal da Família aparecerão aqui." /> : (
      <Table data={dados} columns={[
        { header: "Origem", accessor: "mensalidade", render: (item) => item.pedido ? `Pedido #${item.pedido.id}` : `Mensalidade #${item.mensalidade?.id}` },
        { header: "Aluno", accessor: "mensalidade", render: (item) => (item.mensalidade ?? item.pedido)!.aluno.nome },
        { header: "Valor", accessor: "mensalidade", render: (item) => formatarMoeda(item.pedido?.total ?? item.mensalidade?.valorFinal ?? item.mensalidade?.valor ?? 0) },
        { header: "Gateway", accessor: "gateway" },
        { header: "Tentativa", accessor: "numeroTentativa", render: (item) => `${item.numeroTentativa}ª` },
        { header: "Criada em", accessor: "createdAt", render: (item) => formatarData(item.createdAt) },
        { header: "Status", accessor: "status", render: (item) => <Badge variant={VARIANTE[item.status] ?? "neutral"}>{item.status}</Badge> },
        { header: "Ações", accessor: "id", render: (item) => <div className="conciliacao-acoes">
          {item.gatewayId && <Button size="sm" variant="secondary" title="Consultar status no gateway" disabled={processando === item.id} onClick={() => executar(item, false)}><FiRefreshCw aria-hidden /> Conciliar</Button>}
          {["FALHA", "RECUSADO"].includes(item.status) && <Button size="sm" title="Criar nova tentativa de cobrança" disabled={processando === item.id} onClick={() => executar(item, true)}><FiRotateCw aria-hidden /> Tentar novamente</Button>}
        </div> },
      ]} />
    )}
  </div>;
}
