import { ApiClient } from "../../../shared/api/ApiClient";
import type { Usuario } from "../types/usuario";
import type { UsuarioUpdateFormData } from "../schema/usuario.schema";
export class UsuarioService {
  static async listar() {
    return ApiClient.get<Usuario[]>("/usuarios");
  }
  static async criar(data: UsuarioUpdateFormData) {
    return ApiClient.post<Usuario>("/auth/register", data);
  }
  static async atualizar(id: number, data: UsuarioUpdateFormData) {
    return ApiClient.put<Usuario>(`/usuarios/${id}`, data);
  }
  static async atualizarPerfil(id: number, perfil: string) {
    return ApiClient.patch<Usuario>(`/usuarios/${id}/perfil`, { perfil });
  }
  static async alterarStatus(id: number) {
    return ApiClient.patch<Usuario>(`/usuarios/${id}/ativo`);
  }
}