import { Situacao, type DegrauSituacao } from "../Situacao";

type StatusType =
  | "ATIVO"
  | "INATIVO"
  | "PAGO"
  | "PENDENTE"
  | "VENCIDO"
  | "CANCELADO"
  | "ESTORNADO"
  | "ABERTA"
  | "FINALIZADA";

interface StatusBadgeProps {
  status: StatusType;
}

export function StatusBadge({
  status,
}: StatusBadgeProps) {
  const degrau: Record<StatusType, DegrauSituacao> = {
    ATIVO: "neutro", INATIVO: "inativo", PAGO: "neutro", PENDENTE: "atencao",
    VENCIDO: "acao", CANCELADO: "inativo", ESTORNADO: "inativo", ABERTA: "atencao", FINALIZADA: "neutro",
  };
  return (
    <Situacao degrau={degrau[status]}>
      {{
        ATIVO: "Ativo",
        INATIVO: "Inativo",
        PAGO: "Pago",
        PENDENTE: "Pendente",
        VENCIDO: "Vencido",
        CANCELADO: "Cancelado",
        ESTORNADO: "Estornado",
        ABERTA: "Aberta",
        FINALIZADA: "Finalizada",
      }[status]}
    </Situacao>
  );
}
