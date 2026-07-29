import type { MensalidadeComAluno } from "../types";
import { StatusBadge } from "../../../components/ui/StatusBadge";
import { Button } from "../../../components/ui/Button";
import { useAuth } from "../../../contexts/useAuth";
import { calcularStatusMensalidade } from "../utils/status";
import { nomeFormaPagamento } from "../../formasPagamento/types";
import "./MensalidadeCard.css";
function formatarData(data: string): string {
  return new Date(data).toLocaleDateString("pt-BR");
}
const STATUS_BADGE = {
  PAGA: "PAGO",
  PENDENTE: "PENDENTE",
  VENCIDA: "VENCIDO",
  CANCELADA: "CANCELADO",
  ESTORNADA: "ESTORNADO",
} as const;
interface MensalidadeCardProps {
  mensalidade: MensalidadeComAluno;
  onEditar?: (id: number) => void;
  onMarcarComoPago?: (id: number) => void;
  onCancelar?: (id: number) => void;
  onEstornar?: (id: number) => void;
}
export function MensalidadeCard({
  mensalidade,
  onEditar,
  onMarcarComoPago,
  onCancelar,
  onEstornar,
}: MensalidadeCardProps) {
  const { usuario } = useAuth();
  const ehAdmin = usuario?.perfil === "ADMIN";
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
            R$ {mensalidade.valorFinal.toLocaleString("pt-BR", {
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
        {mensalidade.formaPagamento && (
          <div>
            <span>Forma de pagamento:</span>
            <strong>{nomeFormaPagamento(mensalidade.formaPagamento)}</strong>
          </div>
        )}
      </div>
      <div className="mensalidade-card-actions">
        {!mensalidade.pago && status !== "PAGA" && status !== "CANCELADA" && status !== "ESTORNADA" && (
          <Button type="button" onClick={() => onMarcarComoPago?.(mensalidade.id)}>
            ✓ Marcar como Pago
          </Button>
        )}
        {ehAdmin && status === "PAGA" && (
          <Button type="button" variant="danger" onClick={() => onEstornar?.(mensalidade.id)}>
            Estornar
          </Button>
        )}
        {ehAdmin && status !== "PAGA" && status !== "CANCELADA" && status !== "ESTORNADA" && (
          <Button type="button" variant="danger" onClick={() => onCancelar?.(mensalidade.id)}>
            Cancelar
          </Button>
        )}
        <Button type="button" variant="secondary" onClick={() => onEditar?.(mensalidade.id)}>
          Ver Detalhes
        </Button>
      </div>
    </div>
  );
}
