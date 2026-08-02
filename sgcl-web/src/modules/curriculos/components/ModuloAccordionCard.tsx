import { LuChevronDown, LuChevronRight } from "react-icons/lu";

import { Button } from "../../../components/ui/Button";
import { TrilhaFaixa } from "../../../components/ui/TrilhaFaixa";
import { AulaAccordionCard } from "./AulaAccordionCard";

import type { AulaCurriculo, ModuloCurriculo, TecnicaCurriculo } from "../types/curriculo";

interface ModuloAccordionCardProps {
  modulo: ModuloCurriculo;
  expandido: boolean;
  onToggle: () => void;
  ehAdmin: boolean;
  onEditar: () => void;
  onNovaAula: () => void;
  onExcluir: () => void;
  excluindo: boolean;
  aulaEstaExpandida: (id: number) => boolean;
  onToggleAula: (id: number) => void;
  onEditarAula: (aula: AulaCurriculo) => void;
  onNovaTecnica: (aula: AulaCurriculo) => void;
  onExcluirAula: (aula: AulaCurriculo) => void;
  aulaEstaExcluindo: (id: number) => boolean;
  onEditarTecnica: (aula: AulaCurriculo, tecnica: TecnicaCurriculo) => void;
  onExcluirTecnica: (tecnica: TecnicaCurriculo) => void;
  tecnicaEstaExcluindo: (id: number) => boolean;
}

export function ModuloAccordionCard({
  modulo,
  expandido,
  onToggle,
  ehAdmin,
  onEditar,
  onNovaAula,
  onExcluir,
  excluindo,
  aulaEstaExpandida,
  onToggleAula,
  onEditarAula,
  onNovaTecnica,
  onExcluirAula,
  aulaEstaExcluindo,
  onEditarTecnica,
  onExcluirTecnica,
  tecnicaEstaExcluindo,
}: ModuloAccordionCardProps) {
  return (
    <div className="modulo-card">
      <div
        className="modulo-card-header acordeon-cabecalho"
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
        <div className="acordeon-titulo">
          {expandido ? <LuChevronDown size={16} /> : <LuChevronRight size={16} />}
          <TrilhaFaixa faixa={modulo.faixa} />
          <h3>{modulo.nome}</h3>
          {modulo.faixa && <span className="modulo-faixa">{modulo.faixa}</span>}
          <span className="acordeon-contagem">
            {modulo.aulas.length} aula{modulo.aulas.length === 1 ? "" : "s"}
          </span>
        </div>

        <div className="curriculos-card-acoes" onClick={(e) => e.stopPropagation()}>
          <Button type="button" variant="secondary" onClick={onEditar}>
            Editar
          </Button>

          <Button type="button" variant="secondary" onClick={onNovaAula}>
            + Aula
          </Button>

          {ehAdmin && (
            <Button type="button" variant="danger" disabled={excluindo} onClick={onExcluir}>
              {excluindo ? "Excluindo..." : "Excluir"}
            </Button>
          )}
        </div>
      </div>

      {expandido && (
        <div className="modulo-card-body">
          {modulo.descricao && <p className="modulo-descricao">{modulo.descricao}</p>}

          {modulo.aulas.length === 0 ? (
            <p className="curriculos-vazio">Nenhuma aula planejada.</p>
          ) : (
            modulo.aulas.map((aula) => (
              <AulaAccordionCard
                key={aula.id}
                aula={aula}
                expandida={aulaEstaExpandida(aula.id)}
                onToggle={() => onToggleAula(aula.id)}
                ehAdmin={ehAdmin}
                onEditar={() => onEditarAula(aula)}
                onNovaTecnica={() => onNovaTecnica(aula)}
                onExcluir={() => onExcluirAula(aula)}
                excluindo={aulaEstaExcluindo(aula.id)}
                onEditarTecnica={(tecnica) => onEditarTecnica(aula, tecnica)}
                onExcluirTecnica={onExcluirTecnica}
                tecnicaEstaExcluindo={tecnicaEstaExcluindo}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}
