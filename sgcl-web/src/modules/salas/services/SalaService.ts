import { ApiClient } from "../../../shared/api/ApiClient";
import type { Sala } from "../types/sala";
import type { SalaFormData } from "../schema/sala.schema";

export class SalaService {
  static async listar() {
    return ApiClient.get<Sala[]>("/salas");
  }

  static async criar(data: SalaFormData) {
    return ApiClient.post<Sala>("/salas", data);
  }

  static async editar(id: number, data: SalaFormData) {
    return ApiClient.put<Sala>(`/salas/${id}`, data);
  }

  static async alterarStatus(id: number) {
    return ApiClient.patch<Sala>(`/salas/${id}/ativo`);
  }
}
