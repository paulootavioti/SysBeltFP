import { ApiClient } from "../../../shared/api/ApiClient";

import type { Aluno, AlunoBasico } from "../types";
import type { AlunoCompletoBasico } from "../types/alunoCompleto";
import type { AlunoFormData } from "../schema/aluno.schema";

export class AlunoService {
  static async listar() {
    return ApiClient.get<Aluno[]>("/alunos");
  }

  // mesmo endpoint — o backend devolve o recorte básico quando quem pede é
  // PROFESSOR, então o formato da resposta já vem sem os campos restritos.
  static async listarBasico() {
    return ApiClient.get<AlunoBasico[]>("/alunos");
  }

  static async buscar(id: number) {
    return ApiClient.get<Aluno>(`/alunos/${id}`);
  }

  static async buscarBasico(id: number) {
    return ApiClient.get<AlunoCompletoBasico>(`/alunos/${id}`);
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