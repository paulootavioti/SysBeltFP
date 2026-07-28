import { useEffect, useState } from "react";

import { useAuth } from "../../../contexts/useAuth";
import { UsuarioService } from "../../../modules/usuarios/services/UsuarioService";

import "../SeletorUnidadeVisualizada/styles.css";

interface UnidadeOpcao {
  id: number;
  nome: string;
}

// Admin, Professor e Recepção podem estar vinculados a mais de uma unidade
// — esse seletor deixa esses perfis escolherem em qual estão trabalhando
// agora. Diferente do seletor "ver como" do SUPERADMIN, aqui não existe
// opção de "todas as unidades": sempre precisa haver uma unidade ativa
// escolhida.
const PERFIS_MULTI_UNIDADE = ["ADMIN", "PROFESSOR", "RECEPCAO"];

export function SeletorUnidadeAtiva() {
  const { usuario, unidadeVisualizada, definirUnidadeVisualizada } = useAuth();
  const [unidades, setUnidades] = useState<UnidadeOpcao[]>([]);

  const habilitado = !!usuario?.perfil && PERFIS_MULTI_UNIDADE.includes(usuario.perfil);

  useEffect(() => {
    if (habilitado) UsuarioService.listarMinhasUnidades().then(setUnidades);
  }, [habilitado]);

  if (!habilitado || unidades.length <= 1) return null;

  const unidadeAtivaId = unidadeVisualizada?.id ?? usuario?.unidadeId ?? null;

  function handleChange(event: React.ChangeEvent<HTMLSelectElement>) {
    const unidade = unidades.find((u) => String(u.id) === event.target.value);
    if (unidade) definirUnidadeVisualizada({ id: unidade.id, nome: unidade.nome });
  }

  return (
    <label className="seletor-unidade-visualizada" title="Escolha em qual unidade você está trabalhando agora">
      <span>Unidade ativa</span>
      <select value={unidadeAtivaId ? String(unidadeAtivaId) : ""} onChange={handleChange}>
        {unidades.map((unidade) => (
          <option key={unidade.id} value={String(unidade.id)}>
            {unidade.nome}
          </option>
        ))}
      </select>
    </label>
  );
}
