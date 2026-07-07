import { useEffect, useState } from "react";
import type { Usuario } from "../types/usuario";
import { UsuarioService } from "../services/UsuarioService";
export function useUsuarios() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");
  async function carregarUsuarios() {
    try {
      setLoading(true);
      setErro("");
      const data = await UsuarioService.listar();
      setUsuarios(data);
    } catch {
      setErro("Erro ao carregar usuários.");
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    carregarUsuarios();
  }, []);
  return {
    usuarios,
    setUsuarios,
    loading,
    erro,
    setErro,
    carregarUsuarios,
  };
}