import { useState } from "react";

import { TrilhaFaixa } from "../../../components/ui/TrilhaFaixa";
import { Accordion } from "../../../components/ui/Accordion";
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
      <Accordion
        aberto={expandido}
        onToggle={onToggle}
        titulo={
          <span className="acordeon-titulo">
            <TrilhaFaixa faixa={modulo.faixa} />
            <h3>{modulo.nome}</h3>
            {modulo.faixa && <span className="modulo-faixa">{modulo.faixa}</span>}
            <span className="acordeon-contagem">
              {modulo.aulas.length} aula{modulo.aulas.length === 1 ? "" : "s"}
            </span>
          </span>
        }
      >
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
      </Accordion>
    </div>
  );
}
