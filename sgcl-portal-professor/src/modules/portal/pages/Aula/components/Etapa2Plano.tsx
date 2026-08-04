import type { AulaCurriculoDetalhe } from "../../../types";
import "./Etapa2Plano.css";

interface Etapa2PlanoProps {
  aulaCurriculo: AulaCurriculoDetalhe | null;
  tecnicasRealizadasIds: number[];
  onToggleTecnica: (tecnicaId: number, executada: boolean) => void;
}

function jogosDaAula(jogosSugeridos: string | null): string[] {
  if (!jogosSugeridos) return [];
  return jogosSugeridos
    .split(",")
    .map((jogo) => jogo.trim())
    .filter(Boolean);
}

export function Etapa2Plano({ aulaCurriculo, tecnicasRealizadasIds, onToggleTecnica }: Etapa2PlanoProps) {
  if (!aulaCurriculo) {
    return (
      <div className="etapa-plano-vazio">
        <p>Esta aula não tem um plano de currículo vinculado.</p>
      </div>
    );
  }

  const tecnicas = aulaCurriculo.tecnicas;
  const executadas = tecnicas.filter((tecnica) => tecnicasRealizadasIds.includes(tecnica.id)).length;
  const jogos = jogosDaAula(aulaCurriculo.jogosSugeridos);

  return (
    <div className="etapa-plano">
      {aulaCurriculo.objetivo && (
        <div className="etapa-plano-card">
          <p className="etapa-plano-eyebrow">Objetivo da aula</p>
          <p className="etapa-plano-objetivo">{aulaCurriculo.objetivo}</p>
        </div>
      )}

      <div>
        <div className="etapa-plano-tecnicas-cabecalho">
          <h3>Técnicas</h3>
          <span>
            {executadas}/{tecnicas.length}
          </span>
        </div>

        <div className="etapa-plano-lista">
          {tecnicas.map((tecnica) => {
            const marcada = tecnicasRealizadasIds.includes(tecnica.id);
            return (
              <button
                key={tecnica.id}
                type="button"
                className={`etapa-plano-linha${marcada ? " etapa-plano-linha-marcada" : ""}`}
                onClick={() => onToggleTecnica(tecnica.id, !marcada)}
              >
                <span className={`etapa-plano-checkbox${marcada ? " etapa-plano-checkbox-marcado" : ""}`} aria-hidden="true">
                  {marcada && "✓"}
                </span>

                <span className="etapa-plano-info">
                  <strong className={marcada ? "etapa-plano-riscado" : ""}>{tecnica.nome}</strong>
                  {tecnica.categoria && <span>{tecnica.categoria}</span>}
                </span>

                {tecnica.obrigatoria && <span className="etapa-plano-chip-essencial">essencial</span>}
              </button>
            );
          })}
        </div>
      </div>

      {jogos.length > 0 && (
        <div>
          <h3 className="etapa-plano-jogos-titulo">Jogos</h3>
          <div className="etapa-plano-chips-jogos">
            {jogos.map((jogo) => (
              <span key={jogo} className="etapa-plano-chip-jogo">
                {jogo}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
