import { Modal } from "../Modal";
import { Button } from "../Button";

import "./styles.css";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "primary" | "secondary" | "danger";
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  variant = "danger",
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <Modal open={open} title={title} onClose={onCancel} size="sm">
      <p className="confirm-dialog-mensagem">{message}</p>

      <div className="confirm-dialog-acoes">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={loading}>
          {cancelLabel}
        </Button>

        <Button type="button" variant={variant} onClick={onConfirm} disabled={loading}>
          {loading ? "Aguarde..." : confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}
