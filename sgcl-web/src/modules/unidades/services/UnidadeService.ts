import { ApiClient } from "../../../shared/api/ApiClient";
import type { Unidade, UnidadeOpcao } from "../types/unidade";
import type { UnidadeFormData } from "../schema/unidade.schema";

export class UnidadeService {
  static async listar() {
    return ApiClient.get<Unidade[]>("/unidades");
  }

  // versão enxuta (id/nome) pra ADMIN/PROFESSOR — usada pra popular o
  // seletor de consulta de grade horária de outra unidade.
  static async listarOpcoes() {
    return ApiClient.get<UnidadeOpcao[]>("/unidades/opcoes");
  }

  static async criar(data: UnidadeFormData) {
    return ApiClient.post<Unidade>("/unidades", data);
  }

  static async editar(id: number, data: UnidadeFormData) {
    return ApiClient.put<Unidade>(`/unidades/${id}`, data);
  }

  static async alterarStatus(id: number) {
    return ApiClient.patch<Unidade>(`/unidades/${id}/ativo`);
  }
}
