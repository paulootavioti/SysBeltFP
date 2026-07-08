import { ApiClient } from "../../../shared/api/ApiClient";
import type { Turma, TurmaDetalhada } from "../types/turma";
import type { TurmaFormData } from "../schema/turma.schema";

export class TurmaService {
  static async listar() {
    return ApiClient.get<Turma[]>("/turmas");
  }

  static async buscar(id: number) {
    return ApiClient.get<TurmaDetalhada>(`/turmas/${id}`);
  }

  static async criar(data: TurmaFormData) {
    return ApiClient.post<Turma>("/turmas", {
      ...data,
      curriculoId: data.curriculoId ? Number(data.curriculoId) : undefined,
      limiteAlunos: data.limiteAlunos ? Number(data.limiteAlunos) : undefined,
    });
  }

  static async alterarStatus(id: number) {
    return ApiClient.patch<Turma>(`/turmas/${id}/ativo`);
  }

  static async vincularAluno(turmaId: number, alunoId: number) {
    return ApiClient.patch(`/turmas/${turmaId}/alunos/${alunoId}`);
  }
}