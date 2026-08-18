import { useEffect, useState } from "react";

import { useAuth } from "../../../contexts/useAuth";
import { UsuarioService } from "../../../modules/usuarios/services/UsuarioService";
import {
  PERFIS_MULTI_UNIDADE,
  PERFIS_QUE_VEEM_TODAS,
} from "../../../shared/constants/perfis";

import "../SeletorUnidadeVisualizada/styles.css";

interface UnidadeOpcao {
  id: number;
  nome: string;
}

// A ausência de unidade ativa vira string vazia no <select>, e é ela que o
// contexto traduz em "não mandar o X-Unidade-Id".
const TODAS = "";

export function SeletorUnidadeAtiva() {
  const { usuario, unidadeVisualizada, definirUnidadeVisualizada } = useAuth();
  const [unidades, setUnidades] = useState<UnidadeOpcao[]>([]);

  const habilitado = !!usuario?.perfil && PERFIS_MULTI_UNIDADE.includes(usuario.perfil);

  useEffect(() => {
    if (habilitado) UsuarioService.listarMinhasUnidades().then(setUnidades);
  }, [habilitado]);

  if (!habilitado || unidades.length <= 1) return null;

  const podeVerTodas = PERFIS_QUE_VEEM_TODAS.includes(usuario?.perfil ?? "");
  const unidadeAtivaId = unidadeVisualizada?.id ?? usuario?.unidadeId ?? null;

  function handleChange(event: React.ChangeEvent<HTMLSelectElement>) {
    const unidade = unidades.find((u) => String(u.id) === event.target.value);

    // Sem unidade correspondente é a opção "todas": limpa a escolha em vez de
    // ignorar o evento, que era o que prendia o Dono na última filial.
    if (unidade) {
      definirUnidadeVisualizada({ id: unidade.id, nome: unidade.nome });
    } else if (podeVerTodas) {
      definirUnidadeVisualizada(null);
    }
  }

  return (
    <label className="seletor-unidade-visualizada" title="Escolha em qual unidade você está trabalhando agora">
      <span>Unidade ativa</span>
      <select value={unidadeAtivaId ? String(unidadeAtivaId) : TODAS} onChange={handleChange}>
        {podeVerTodas && <option value={TODAS}>Todas as unidades</option>}
        {unidades.map((unidade) => (
          <option key={unidade.id} value={String(unidade.id)}>
            {unidade.nome}
          </option>
        ))}
      </select>
    </label>
  );
}
