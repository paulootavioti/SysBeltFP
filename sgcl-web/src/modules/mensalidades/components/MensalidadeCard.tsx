import type { MensalidadeComAluno } from "../types";
import { StatusBadge } from "../../../components/ui/StatusBadge";
import { Button } from "../../../components/ui/Button";
import { calcularStatusMensalidade } from "../utils/status";
import "./MensalidadeCard.css";
function formatarData(data: string): string {
  return new Date(data).toLocaleDateString("pt-BR");
}
const STATUS_BADGE = {
  PAGA: "PAGO",
  PENDENTE: "PENDENTE",
  VENCIDA: "VENCIDO",
} as const;
interface MensalidadeCardProps {
  mensalidade: MensalidadeComAluno;
  onEditar?: (id: number) => void;
  onMarcarComoPago?: (id: number) => void;
}
export function MensalidadeCard({
  mensalidade,
  onEditar,
  onMarcarComoPago,
}: MensalidadeCardProps) {
  const status = calcularStatusMensalidade(mensalidade);
  return (
    <div className="mensalidade-card">
      <div className="mensalidade-card-header">
        <div>
          <h3>{mensalidade.aluno?.nome}</h3>
          <p>{mensalidade.descricao || "Mensalidade"} · Faixa: {mensalidade.aluno?.faixa}</p>
        </div>
        <StatusBadge status={STATUS_BADGE[status]} />
      </div>
      <div className="mensalidade-card-info">
        <div>
          <span>Valor:</span>
          <strong>
            R$ {mensalidade.valor.toLocaleString("pt-BR", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </strong>
        </div>
        <div>
          <span>Vencimento:</span>
          <strong>{formatarData(mensalidade.vencimento)}</strong>
        </div>
        {mensalidade.dataPagamento && (
          <div>
            <span>Pagamento:</span>
            <strong>{formatarData(mensalidade.dataPagamento)}</strong>
          </div>
        )}
      </div>
      <div className="mensalidade-card-actions">
        {!mensalidade.pago && status !== "PAGA" && (
          <Button type="button" onClick={() => onMarcarComoPago?.(mensalidade.id)}>
            ✓ Marcar como Pago
          </Button>
        )}
        <Button type="button" variant="secondary" onClick={() => onEditar?.(mensalidade.id)}>
          Ver Detalhes
        </Button>
      </div>
    </div>
  );
}