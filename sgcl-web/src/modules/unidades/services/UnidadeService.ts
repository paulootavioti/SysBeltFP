import { ApiClient } from "../../../shared/api/ApiClient";
import type { Unidade } from "../types/unidade";
import type { UnidadeFormData } from "../schema/unidade.schema";

export class UnidadeService {
  static async listar() {
    return ApiClient.get<Unidade[]>("/unidades");
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
