import { ApiClient } from "../../../shared/api/ApiClient";

import type { Aluno } from "../types";
import type { AlunoFormData } from "../schema/aluno.schema";

export class AlunoService {
  static async listar() {
    return ApiClient.get<Aluno[]>("/alunos");
  }

  static async buscar(id: number) {
    return ApiClient.get<Aluno>(`/alunos/${id}`);
  }

  static async criar(data: AlunoFormData) {
    return ApiClient.post<Aluno>("/alunos", data);
  }

  static async editar(
    id: number,
    data: AlunoFormData
  ) {
    return ApiClient.put<Aluno>(`/alunos/${id}`, data);
  }

  static async alterarStatus(id: number) {
    return ApiClient.patch<Aluno>(`/alunos/${id}/ativo`);
  }
  
  static async prontuario<T>(id: number) {
    return ApiClient.get<T>(`/alunos/${id}/prontuario`);
  }
}