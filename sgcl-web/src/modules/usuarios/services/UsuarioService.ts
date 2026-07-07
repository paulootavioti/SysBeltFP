import { ApiClient } from "../../../shared/api/ApiClient";
import type { Usuario } from "../types/usuario";
import type { UsuarioFormData } from "../schema/usuario.schema";
export class UsuarioService {
  static async listar() {
    return ApiClient.get<Usuario[]>("/usuarios");
  }
  static async criar(data: UsuarioFormData) {
    return ApiClient.post<Usuario>("/auth/register", data);
  }
  static async atualizarPerfil(id: number, perfil: string) {
    return ApiClient.patch<Usuario>(`/usuarios/${id}/perfil`, { perfil });
  }
  static async alterarStatus(id: number) {
    return ApiClient.patch<Usuario>(`/usuarios/${id}/ativo`);
  }
}