import { useEffect, useRef } from "react";
import type { ReactNode } from "react";

import "./styles.css";

interface BottomSheetProps {
  open: boolean;
  title: string;
  children: ReactNode;
  onClose: () => void;
}

const SELETOR_FOCAVEL =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

// mesmo comportamento de acessibilidade do Modal (focus trap, Esc, devolve
// o foco ao fechar) — só a posição/animação muda: desliza de baixo pra
// cima, cantos superiores arredondados, em vez de diálogo centralizado.
export function BottomSheet({ open, title, children, onClose }: BottomSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const elementoAnteriorRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;

    elementoAnteriorRef.current = document.activeElement as HTMLElement | null;

    const primeiroFocavel = sheetRef.current?.querySelector<HTMLElement>(SELETOR_FOCAVEL);
    (primeiroFocavel ?? sheetRef.current)?.focus();

    return () => {
      elementoAnteriorRef.current?.focus();
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
        return;
      }

      if (event.key !== "Tab" || !sheetRef.current) return;

      const focaveis = Array.from(sheetRef.current.querySelectorAll<HTMLElement>(SELETOR_FOCAVEL));
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
    <div className="bottom-sheet-overlay" onClick={onClose}>
      <div
        className="bottom-sheet"
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="bottom-sheet-alca" aria-hidden="true" />

        <header className="bottom-sheet-header">
          <h2>{title}</h2>
          <button type="button" className="bottom-sheet-close" onClick={onClose} aria-label="Fechar">
            ×
          </button>
        </header>

        <div className="bottom-sheet-content">{children}</div>
      </div>
    </div>
  );
}
