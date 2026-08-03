import { useEffect, useRef } from "react";
import type { ReactNode } from "react";

import "./styles.css";

interface ModalProps {
  open: boolean;
  title: string;
  children: ReactNode;
  onClose: () => void;
  // sm = 420px (confirmação), md = 560px (formulário, padrão),
  // lg = 600px (formulário com repeater/mais campos).
  size?: "sm" | "md" | "lg";
}

const SELETOR_FOCAVEL =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function Modal({
  open,
  title,
  children,
  onClose,
  size = "md",
}: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const elementoAnteriorRef = useRef<HTMLElement | null>(null);

  // Ao abrir: guarda quem tinha o foco (pra devolver ao fechar) e move o
  // foco pro primeiro elemento focável dentro do modal.
  useEffect(() => {
    if (!open) return;

    elementoAnteriorRef.current = document.activeElement as HTMLElement | null;

    const primeiroFocavel = modalRef.current?.querySelector<HTMLElement>(SELETOR_FOCAVEL);
    (primeiroFocavel ?? modalRef.current)?.focus();

    return () => {
      elementoAnteriorRef.current?.focus();
    };
  }, [open]);

  // Esc fecha; Tab/Shift+Tab ficam presos dentro do modal (focus trap).
  useEffect(() => {
    if (!open) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
        return;
      }

      if (event.key !== "Tab" || !modalRef.current) return;

      const focaveis = Array.from(modalRef.current.querySelectorAll<HTMLElement>(SELETOR_FOCAVEL));
      if (focaveis.length === 0) return;

      const primeiro = focaveis[0];
      const ultimo = focaveis[focaveis.length - 1];

      if (event.shiftKey && document.activeElement === primeiro) {
        event.preventDefault();
        ultimo.focus();
      } else if (!event.shiftKey && document.activeElement === ultimo) {
        event.preventDefault();
        primeiro.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="modal-overlay">
      <div
        className={`modal modal-${size}`}
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
      >
        <header className="modal-header">
          <h2>{title}</h2>

          <button
            type="button"
            className="modal-close"
            onClick={onClose}
            aria-label="Fechar"
          >
            ×
          </button>
        </header>

        <div className="modal-content">
          {children}
        </div>
      </div>
    </div>
  );
}
