import { ApiClient } from "../../../shared/api/ApiClient";
import type { Curriculo } from "../types/curriculo";
import type {
  CurriculoFormData,
  ModuloFormData,
  AulaCurriculoFormData,
  TecnicaCurriculoFormData,
} from "../schema/curriculo.schema";

export class CurriculoService {
  static async listar() {
    return ApiClient.get<Curriculo[]>("/curriculos");
  }

  static async criar(data: CurriculoFormData) {
    return ApiClient.post<Curriculo>("/curriculos", data);
  }

  static async criarModulo(data: ModuloFormData & { curriculoId: number }) {
    return ApiClient.post("/curriculos/modulos", data);
  }

  static async criarAula(
    data: Omit<AulaCurriculoFormData, "duracaoMinutos"> & {
      duracaoMinutos?: number;
      moduloId: number;
    }
  ) {
    return ApiClient.post("/curriculos/aulas", data);
  }

  static async criarTecnica(data: TecnicaCurriculoFormData & { aulaCurriculoId: number }) {
    return ApiClient.post("/curriculos/tecnicas", data);
  }

  static async atualizar(id: number, data: CurriculoFormData) {
    return ApiClient.put<Curriculo>(`/curriculos/${id}`, data);
  }

  static async atualizarModulo(id: number, data: ModuloFormData) {
    return ApiClient.put(`/curriculos/modulos/${id}`, data);
  }

  static async atualizarAula(
    id: number,
    data: Omit<AulaCurriculoFormData, "duracaoMinutos"> & { duracaoMinutos?: number }
  ) {
    return ApiClient.put(`/curriculos/aulas/${id}`, data);
  }

  static async atualizarTecnica(id: number, data: TecnicaCurriculoFormData) {
    return ApiClient.put(`/curriculos/tecnicas/${id}`, data);
  }

  static async excluir(id: number) {
    return ApiClient.delete(`/curriculos/${id}`);
  }
}