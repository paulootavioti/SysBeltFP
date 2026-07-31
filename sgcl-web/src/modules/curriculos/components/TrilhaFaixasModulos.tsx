import { FaixaSwatch } from "./FaixaSwatch";
import type { ModuloCurriculo } from "../types/curriculo";

interface TrilhaFaixasModulosProps {
  modulos: ModuloCurriculo[];
}

export function TrilhaFaixasModulos({ modulos }: TrilhaFaixasModulosProps) {
  const temAlgumaFaixa = modulos.some((modulo) => modulo.faixa);

  if (!temAlgumaFaixa) return null;

  return (
    <div className="trilha-faixas-modulos">
      {modulos.map((modulo, indice) =>
        modulo.faixa ? (
          <FaixaSwatch
            key={modulo.id}
            faixa={modulo.faixa}
            size={18}
            title={`Módulo ${indice + 1}: ${modulo.nome} (${modulo.faixa})`}
          />
        ) : null
      )}
    </div>
  );
}
