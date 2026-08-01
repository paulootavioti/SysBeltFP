import { LuChevronDown, LuChevronRight, LuThumbsDown, LuThumbsUp } from "react-icons/lu";

import type { ArtigoAjuda, Feedback } from "../types";

interface ArtigoCardProps {
  artigo: ArtigoAjuda;
  expandido: boolean;
  onToggle: () => void;
  feedback?: Feedback;
  onFeedback: (feedback: Feedback) => void;
}

export function ArtigoCard({ artigo, expandido, onToggle, feedback, onFeedback }: ArtigoCardProps) {
  return (
    <article className="artigo-card">
      <div
        className="artigo-card-cabecalho"
        role="button"
        tabIndex={0}
        aria-expanded={expandido}
        onClick={onToggle}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onToggle();
          }
        }}
      >
        <div className="artigo-card-titulo">
          {expandido ? <LuChevronDown size={16} /> : <LuChevronRight size={16} />}
          <div>
            <h3>{artigo.titulo}</h3>
            <p>{artigo.resumo}</p>
          </div>
        </div>
      </div>

      {expandido && (
        <div className="artigo-card-corpo">
          <ol>
            {artigo.conteudo.map((passo, indice) => (
              <li key={indice}>{passo}</li>
            ))}
          </ol>

          <div className="artigo-card-feedback">
            <span>Este artigo foi útil?</span>

            <button
              type="button"
              className={`artigo-card-feedback-botao${feedback === "util" ? " artigo-card-feedback-ativo" : ""}`}
              onClick={() => onFeedback("util")}
            >
              <LuThumbsUp size={14} /> Útil
            </button>

            <button
              type="button"
              className={`artigo-card-feedback-botao${feedback === "nao-util" ? " artigo-card-feedback-ativo" : ""}`}
              onClick={() => onFeedback("nao-util")}
            >
              <LuThumbsDown size={14} /> Não útil
            </button>

            {feedback && <span className="artigo-card-feedback-obrigado">Obrigado pelo feedback!</span>}
          </div>
        </div>
      )}
    </article>
  );
}
