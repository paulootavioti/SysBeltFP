import { useState } from "react";
import { LuChevronDown, LuChevronRight } from "react-icons/lu";

import { FaixaSwatch } from "../../curriculos/components/FaixaSwatch";
import { AulaSomenteLeituraCard } from "./AulaSomenteLeituraCard";
import type { ModuloCurriculo } from "../../curriculos/types/curriculo";

interface ModuloSomenteLeituraCardProps {
  modulo: ModuloCurriculo;
  expandido: boolean;
  onToggle: () => void;
}

export function ModuloSomenteLeituraCard({ modulo, expandido, onToggle }: ModuloSomenteLeituraCardProps) {
  const [aulasAbertas, setAulasAbertas] = useState<Record<number, boolean>>({});

  function alternarAula(id: number) {
    setAulasAbertas((atual) => ({ ...atual, [id]: !(atual[id] ?? false) }));
  }

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
          <FaixaSwatch faixa={modulo.faixa} />
          <h3>{modulo.nome}</h3>
          {modulo.faixa && <span className="modulo-faixa">{modulo.faixa}</span>}
          <span className="acordeon-contagem">
            {modulo.aulas.length} aula{modulo.aulas.length === 1 ? "" : "s"}
          </span>
        </div>
      </div>

      {expandido && (
        <div className="modulo-card-body">
          {modulo.descricao && <p className="modulo-descricao">{modulo.descricao}</p>}

          {modulo.aulas.length === 0 ? (
            <p className="curriculos-vazio">Nenhuma aula planejada.</p>
          ) : (
            modulo.aulas.map((aula) => (
              <AulaSomenteLeituraCard
                key={aula.id}
                aula={aula}
                expandida={aulasAbertas[aula.id] ?? false}
                onToggle={() => alternarAula(aula.id)}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}
