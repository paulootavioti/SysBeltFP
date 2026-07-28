import { ApiClient } from "../../../shared/api/ApiClient";
import type { MetaDashboard } from "../types";
import type { MetaFormData } from "../schema/meta.schema";

export class MetaService {
  static async listar() {
    return ApiClient.get<MetaDashboard[]>("/metas");
  }

  static async listarDashboard() {
    return ApiClient.get<MetaDashboard[]>("/metas/dashboard");
  }

  static async criar(data: MetaFormData) {
    return ApiClient.post<MetaDashboard>("/metas", data);
  }

  static async atualizar(id: number, data: MetaFormData) {
    return ApiClient.put<MetaDashboard>(`/metas/${id}`, data);
  }

  static async excluir(id: number) {
    return ApiClient.delete(`/metas/${id}`);
  }
}
