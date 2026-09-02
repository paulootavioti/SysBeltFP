import "./styles.css";

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
  return (
    <span
      className={`status-badge status-${status.toLowerCase()}`}
    >
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
    </span>
  );
}
