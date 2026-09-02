import { LuCircleCheck, LuCircleX, LuInfo, LuX } from "react-icons/lu";
import type { ToastItem } from "../../../contexts/toast/toastContext";
import "./styles.css";

const ICONES = {
  success: LuCircleCheck,
  error: LuCircleX,
  info: LuInfo,
};

interface ToastContainerProps {
  toasts: ToastItem[];
  onFechar: (id: number) => void;
}

export function ToastContainer({ toasts, onFechar }: ToastContainerProps) {
  if (toasts.length === 0) return null;

  return (
    <div className="toast-container" role="status" aria-live="polite" aria-atomic="false">
      {toasts.map((toast) => {
        const Icone = ICONES[toast.tipo];
        return (
          <div key={toast.id} className={`toast toast-${toast.tipo}`}>
            <Icone size={18} />
            <span className="toast-mensagem">{toast.mensagem}</span>
            <button
              type="button"
              className="toast-fechar"
              onClick={() => onFechar(toast.id)}
              aria-label="Fechar notificação"
            >
              <LuX size={16} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
