import { LuChevronDown, LuChevronRight, LuX } from "react-icons/lu";

import { Button } from "../../../components/ui/Button";
import { Badge } from "../../../components/ui/Badge";

import type { AulaCurriculo, TecnicaCurriculo } from "../types/curriculo";

interface AulaAccordionCardProps {
  aula: AulaCurriculo;
  expandida: boolean;
  onToggle: () => void;
  ehAdmin: boolean;
  onEditar: () => void;
  onNovaTecnica: () => void;
  onExcluir: () => void;
  excluindo: boolean;
  onEditarTecnica: (tecnica: TecnicaCurriculo) => void;
  onExcluirTecnica: (tecnica: TecnicaCurriculo) => void;
  tecnicaEstaExcluindo: (id: number) => boolean;
}

function jogosDaAula(jogosSugeridos?: string | null): string[] {
  if (!jogosSugeridos) return [];
  return jogosSugeridos
    .split(",")
    .map((jogo) => jogo.trim())
    .filter(Boolean);
}

export function AulaAccordionCard({
  aula,
  expandida,
  onToggle,
  ehAdmin,
  onEditar,
  onNovaTecnica,
  onExcluir,
  excluindo,
  onEditarTecnica,
  onExcluirTecnica,
  tecnicaEstaExcluindo,
}: AulaAccordionCardProps) {
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

        <div className="curriculos-card-acoes" onClick={(e) => e.stopPropagation()}>
          <Button type="button" variant="secondary" onClick={onEditar}>
            Editar
          </Button>

          <Button type="button" variant="secondary" onClick={onNovaTecnica}>
            + Técnica
          </Button>

          {ehAdmin && (
            <Button type="button" variant="danger" disabled={excluindo} onClick={onExcluir}>
              {excluindo ? "Excluindo..." : "Excluir"}
            </Button>
          )}
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
                  <button
                    type="button"
                    className="tecnica-badge-botao"
                    title="Clique para editar"
                    onClick={() => onEditarTecnica(tecnica)}
                  >
                    <Badge variant={tecnica.obrigatoria ? "info" : "neutral"}>{tecnica.nome}</Badge>
                  </button>

                  {ehAdmin && (
                    <button
                      type="button"
                      className="tecnica-excluir-botao"
                      title="Excluir técnica"
                      aria-label={`Excluir técnica ${tecnica.nome}`}
                      disabled={tecnicaEstaExcluindo(tecnica.id)}
                      onClick={() => onExcluirTecnica(tecnica)}
                    >
                      <LuX size={12} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
