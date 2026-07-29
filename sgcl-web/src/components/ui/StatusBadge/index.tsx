import "./styles.css";

type StatusType =
  | "ATIVO"
  | "INATIVO"
  | "PAGO"
  | "PENDENTE"
  | "VENCIDO";

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
      {status}
    </span>
  );
}