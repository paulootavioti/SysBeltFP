import { useEffect, useState } from "react";

import { useAuth } from "../../../contexts/useAuth";
import { UnidadeService } from "../../../modules/unidades/services/UnidadeService";
import type { Unidade } from "../../../modules/unidades/types/unidade";

import "./styles.css";

const TODAS = "";

export function SeletorUnidadeVisualizada() {
  const { usuario, unidadeVisualizada, definirUnidadeVisualizada } = useAuth();
  const [unidades, setUnidades] = useState<Unidade[]>([]);

  useEffect(() => {
    if (usuario?.perfil === "SUPERADMIN") {
      UnidadeService.listar().then(setUnidades);
    }
  }, [usuario?.perfil]);

  if (usuario?.perfil !== "SUPERADMIN") return null;

  function handleChange(event: React.ChangeEvent<HTMLSelectElement>) {
    const valor = event.target.value;

    if (valor === TODAS) {
      definirUnidadeVisualizada(null);
      return;
    }

    const unidade = unidades.find((u) => String(u.id) === valor);
    definirUnidadeVisualizada(unidade ? { id: unidade.id, nome: unidade.nome } : null);
  }

  return (
    <label className="seletor-unidade-visualizada" title="Escolha qual unidade visualizar no sistema">
      <span>Visualizando</span>
      <select value={unidadeVisualizada ? String(unidadeVisualizada.id) : TODAS} onChange={handleChange}>
        <option value={TODAS}>Todas as unidades</option>
        {unidades.map((unidade) => (
          <option key={unidade.id} value={String(unidade.id)}>
            {unidade.nome}
          </option>
        ))}
      </select>
    </label>
  );
}
