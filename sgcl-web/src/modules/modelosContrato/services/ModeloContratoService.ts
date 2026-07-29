import { ApiClient } from "../../../shared/api/ApiClient";
import type { ModeloContrato } from "../types";
import type { ModeloContratoFormData } from "../schema/modeloContrato.schema";

export class ModeloContratoService {
  static async listar() {
    return ApiClient.get<ModeloContrato[]>("/modelos-contrato");
  }

  static async criar(data: ModeloContratoFormData) {
    return ApiClient.post<ModeloContrato>("/modelos-contrato", data);
  }

  static async editar(id: number, data: ModeloContratoFormData) {
    return ApiClient.put<ModeloContrato>(`/modelos-contrato/${id}`, data);
  }

  static async alternarAtivo(id: number) {
    return ApiClient.patch<ModeloContrato>(`/modelos-contrato/${id}/ativo`, {});
  }

  static async versionar(id: number) {
    return ApiClient.post<ModeloContrato>(`/modelos-contrato/${id}/versionar`, {});
  }

  static async clonar(id: number) {
    return ApiClient.post<ModeloContrato>(`/modelos-contrato/${id}/clonar`, {});
  }
}
