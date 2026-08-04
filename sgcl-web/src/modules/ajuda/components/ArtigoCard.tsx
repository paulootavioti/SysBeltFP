import { LuThumbsDown, LuThumbsUp } from "react-icons/lu";

import { Accordion } from "../../../components/ui/Accordion";
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
      <Accordion
        aberto={expandido}
        onToggle={onToggle}
        titulo={
          <span className="artigo-card-titulo">
            <h3>{artigo.titulo}</h3>
            <p>{artigo.resumo}</p>
          </span>
        }
      >
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
      </Accordion>
    </article>
  );
}
