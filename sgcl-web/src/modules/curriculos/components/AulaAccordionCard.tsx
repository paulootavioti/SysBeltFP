import { LuX } from "react-icons/lu";

import { Button } from "../../../components/ui/Button";
import { Badge } from "../../../components/ui/Badge";
import { Accordion } from "../../../components/ui/Accordion";

import type { AulaCurriculo, TecnicaCurriculo } from "../types/curriculo";
import { jogosDaAula } from "../utils/jogosDaAula";

interface AulaAccordionCardProps {
  aula: AulaCurriculo;
  expandida: boolean;
  onToggle: () => void;
  ehAdmin: boolean;
  onEditar: () => void;
  onDuplicar: () => void;
  onNovaTecnica: () => void;
  onExcluir: () => void;
  excluindo: boolean;
  onEditarTecnica: (tecnica: TecnicaCurriculo) => void;
  onExcluirTecnica: (tecnica: TecnicaCurriculo) => void;
  tecnicaEstaExcluindo: (id: number) => boolean;
}

export function AulaAccordionCard({
  aula,
  expandida,
  onToggle,
  ehAdmin,
  onEditar,
  onDuplicar,
  onNovaTecnica,
  onExcluir,
  excluindo,
  onEditarTecnica,
  onExcluirTecnica,
  tecnicaEstaExcluindo,
}: AulaAccordionCardProps) {
  const jogos = jogosDaAula(aula.jogosSugeridos);
  const totalMinutos = Math.ceil(aula.filaCompilada.duracaoTotalSegundos / 60);
  const limiteMinutos = aula.duracaoTurmaMinutos ?? aula.duracaoMinutos;
  const excedeu = limiteMinutos != null && totalMinutos > limiteMinutos;

  return (
    <div className="aula-curriculo-card">
      <Accordion
        aberto={expandida}
        onToggle={onToggle}
        titulo={
          <span className="acordeon-titulo">
            <h4>{aula.titulo}</h4>
            <span className="acordeon-meta">{aula.filaCompilada.blocos.length} etapas · {totalMinutos} min</span>
          </span>
        }
        acoes={
          <div className="curriculos-card-acoes">
            <Button type="button" variant="secondary" onClick={onEditar}>
              Editar
            </Button>

            <Button type="button" variant="secondary" onClick={onDuplicar}>
              Duplicar
            </Button>

            {aula.blocos.length === 0 && aula.tecnicas.length > 0 && <Button type="button" variant="secondary" onClick={onNovaTecnica}>
              + Técnica
            </Button>}

            {ehAdmin && (
              <Button type="button" variant="danger" disabled={excluindo} onClick={onExcluir}>
                {excluindo ? "Excluindo..." : "Excluir"}
              </Button>
            )}
          </div>
        }
      >
        <div className="aula-curriculo-body">
          {excedeu && (
            <p className="curriculo-duracao-alerta" role="alert">
              O plano excede em {totalMinutos - (limiteMinutos ?? 0)} min a duração da turma.
            </p>
          )}
          {aula.objetivo && <p>{aula.objetivo}</p>}
          {aula.descricao && <p>{aula.descricao}</p>}
          {aula.blocos.length === 0 && aula.tecnicas.length > 0 && <p className="curriculos-vazio">Esta aula usa o formato antigo de técnicas. Para cronometrar, adicione etapas ao editar a aula.</p>}

          {jogos.length > 0 && (
            <div className="jogos-lista">
              {jogos.map((jogo) => (
                <span key={jogo} className="jogo-chip">
                  {jogo}
                </span>
              ))}
            </div>
          )}

          {aula.blocos.length > 0 && (
            <ol className="curriculo-fila-resumo">
              {aula.filaCompilada.blocos.map((bloco) => (
                <li key={bloco.chave}><span>{bloco.nome}</span><strong>{Math.ceil(bloco.duracaoPrevistaSegundos / 60)} min</strong></li>
              ))}
            </ol>
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

                  {tecnica.descricao && <small className="tecnica-descricao">{tecnica.descricao}</small>}

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
      </Accordion>
    </div>
  );
}
