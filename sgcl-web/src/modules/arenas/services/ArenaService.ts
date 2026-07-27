import { ApiClient } from "../../../shared/api/ApiClient";
import type { Arena } from "../types/arena";
import type { ArenaFormData } from "../schema/arena.schema";

export class ArenaService {
  static async listar() {
    return ApiClient.get<Arena[]>("/arenas");
  }

  static async criar(data: ArenaFormData) {
    return ApiClient.post<Arena>("/arenas", {
      nome: data.nome,
      unidadeId: data.unidadeId ? Number(data.unidadeId) : undefined,
    });
  }

  static async editar(id: number, data: ArenaFormData) {
    // arena já pertence a uma unidade fixa — editar não muda isso.
    return ApiClient.put<Arena>(`/arenas/${id}`, { nome: data.nome });
  }

  static async alterarStatus(id: number) {
    return ApiClient.patch<Arena>(`/arenas/${id}/ativo`);
  }
}
