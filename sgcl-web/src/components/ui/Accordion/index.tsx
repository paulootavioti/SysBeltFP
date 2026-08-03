import type { ReactNode } from "react";
import { LuChevronRight } from "react-icons/lu";

import "./styles.css";

interface AccordionProps {
  titulo: ReactNode;
  aberto: boolean;
  onToggle: () => void;
  children: ReactNode;
  acoes?: ReactNode;
}

// Cabeçalho clicável + chevron que rotaciona via CSS (em vez do swap de
// ícone LuChevronDown/LuChevronRight usado nas 4 implementações
// hand-rolled que já existiam: curriculos, professor, ajuda, sidebar).
export function Accordion({ titulo, aberto, onToggle, children, acoes }: AccordionProps) {
  return (
    <div className="accordion">
      <div className="accordion-cabecalho">
        <button
          type="button"
          className="accordion-gatilho"
          onClick={onToggle}
          aria-expanded={aberto}
        >
          <LuChevronRight size={16} className={`accordion-chevron${aberto ? " accordion-chevron-aberto" : ""}`} />
          <span className="accordion-titulo">{titulo}</span>
        </button>

        {acoes && <div className="accordion-acoes">{acoes}</div>}
      </div>

      {aberto && <div className="accordion-conteudo">{children}</div>}
    </div>
  );
}
