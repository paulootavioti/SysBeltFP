import type { MensalidadeComAluno } from "../types";
import { Situacao, type DegrauSituacao } from "../../../components/ui/Situacao";
import { AmostraFaixa } from "../../../components/ui/AmostraFaixa";
import { Button } from "../../../components/ui/Button";
import { useAuth } from "../../../contexts/useAuth";
import { calcularStatusMensalidade } from "../utils/status";
import { nomeFormaPagamento } from "../../formasPagamento/types";
import "./MensalidadeCard.css";
import { formatarData } from "../../../shared/utils/formatarData";
import { resolverCorFaixa } from "../../../shared/constants/coresFaixa";

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
  const diferencaDias = Math.ceil((new Date(mensalidade.vencimento).getTime() - Date.now()) / 86_400_000);
  const rotuloStatus = status === "VENCIDA" ? `Vencida há ${Math.max(1, Math.abs(diferencaDias))} dias` : status === "PENDENTE" ? (diferencaDias <= 5 ? `Vence em ${Math.max(0, diferencaDias)} dias` : `Vence em ${diferencaDias} dias`) : status === "PAGA" ? "Em dia" : status === "CANCELADA" ? "Cancelada" : "Estornada";
  const degrauStatus: DegrauSituacao = status === "VENCIDA" ? "acao" : status === "PENDENTE" && diferencaDias <= 5 ? "atencao" : status === "CANCELADA" || status === "ESTORNADA" ? "inativo" : "neutro";
  return (
    <article className="mensalidade-card" role="link" tabIndex={0} style={{ borderLeftColor: resolverCorFaixa(mensalidade.aluno?.faixaCor) }} onClick={() => onEditar?.(mensalidade.id)} onKeyDown={(evento) => { if (evento.key === "Enter") onEditar?.(mensalidade.id); }}>
      <div className="mensalidade-card-header">
        <div>
          <h3><AmostraFaixa cor={mensalidade.aluno?.faixaCor} graduacao={mensalidade.aluno?.faixa ?? "Sem graduação"} tamanho="compacta" />{mensalidade.aluno?.nome}</h3>
          <p>{mensalidade.aluno?.turmaNome ?? "Sem turma"} · {mensalidade.aluno?.faixa ?? "Sem graduação"}</p>
        </div>
        <Situacao degrau={degrauStatus}>{rotuloStatus}</Situacao>
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
      <div className="mensalidade-card-actions" onClick={(evento) => evento.stopPropagation()}>
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
    </article>
  );
}
