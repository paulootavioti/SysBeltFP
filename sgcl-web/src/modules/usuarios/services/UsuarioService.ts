import { ApiClient } from "../../../shared/api/ApiClient";
import type { Usuario, ProfessorOpcao } from "../types/usuario";
import type { UsuarioUpdateFormData } from "../schema/usuario.schema";
export class UsuarioService {
  static async listar() {
    return ApiClient.get<Usuario[]>("/usuarios");
  }
  // versão enxuta (id/nome/apelido) — ADMIN e PROFESSOR usam pra escolher
  // um professor substituto na transferência de aula.
  static async listarProfessores() {
    return ApiClient.get<ProfessorOpcao[]>("/usuarios/professores");
  }
  // unidades vinculadas ao usuário autenticado — usada pelo seletor de
  // "unidade ativa" quando um ADMIN/RECEPCAO tem mais de uma.
  static async listarMinhasUnidades() {
    return ApiClient.get<{ id: number; nome: string }[]>("/usuarios/minhas-unidades");
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