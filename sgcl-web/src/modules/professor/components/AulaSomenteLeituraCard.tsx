import { LuChevronDown, LuChevronRight } from "react-icons/lu";

import { Badge } from "../../../components/ui/Badge";
import type { AulaCurriculo } from "../../curriculos/types/curriculo";

interface AulaSomenteLeituraCardProps {
  aula: AulaCurriculo;
  expandida: boolean;
  onToggle: () => void;
}

function jogosDaAula(jogosSugeridos?: string | null): string[] {
  if (!jogosSugeridos) return [];
  return jogosSugeridos
    .split(",")
    .map((jogo) => jogo.trim())
    .filter(Boolean);
}

export function AulaSomenteLeituraCard({ aula, expandida, onToggle }: AulaSomenteLeituraCardProps) {
  const jogos = jogosDaAula(aula.jogosSugeridos);

  return (
    <div className="aula-curriculo-card">
      <div
        className="aula-curriculo-header acordeon-cabecalho"
        role="button"
        tabIndex={0}
        aria-expanded={expandida}
        onClick={onToggle}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onToggle();
          }
        }}
      >
        <div className="acordeon-titulo">
          {expandida ? <LuChevronDown size={16} /> : <LuChevronRight size={16} />}
          <h4>{aula.titulo}</h4>
          {aula.duracaoMinutos != null && <span className="acordeon-meta">⏱ {aula.duracaoMinutos} min</span>}
          <span className="acordeon-contagem">
            {aula.tecnicas.length} técnica{aula.tecnicas.length === 1 ? "" : "s"}
          </span>
        </div>
      </div>

      {expandida && (
        <div className="aula-curriculo-body">
          {aula.objetivo && <p>🎯 {aula.objetivo}</p>}
          {aula.descricao && <p>{aula.descricao}</p>}

          {jogos.length > 0 && (
            <div className="jogos-lista">
              {jogos.map((jogo) => (
                <span key={jogo} className="jogo-chip">
                  🎮 {jogo}
                </span>
              ))}
            </div>
          )}

          {aula.tecnicas.length > 0 && (
            <div className="tecnicas-lista">
              {aula.tecnicas.map((tecnica) => (
                <div key={tecnica.id} className="tecnica-item">
                  <Badge variant={tecnica.obrigatoria ? "info" : "neutral"}>{tecnica.nome}</Badge>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
