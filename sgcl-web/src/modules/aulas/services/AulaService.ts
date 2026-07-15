import { api } from "../../../services/api";

import type { Aula, AulaAluno, AulaProgramada } from "../types";

interface StartAulaData {
  turmaId: number;
  aulaCurriculoId?: number;
  professor?: string;
  observacoes?: string;
}

interface UpdateAulaAlunoData {
  presente?: boolean;

  respeito?: boolean;
  valentia?: boolean;
  esforco?: boolean;
  atencao?: boolean;
  disciplina?: boolean;

  observacao?: string | null;
}

interface UpdateAulaData {
  jogosRealizados?: string[];
  tecnicasRealizadasIds?: number[];
}

export class AulaService {
  static async listar() {
    const response = await api.get<Aula[]>("/aulas");

    return response.data;
  }

  static async buscar(id: number) {
    const response = await api.get<Aula>(`/aulas/${id}`);

    return response.data;
  }

  static async iniciar(data: StartAulaData) {
    const response = await api.post<Aula>("/aulas", data);

    return response.data;
  }

  static async atualizarAluno(
    aulaAlunoId: number,
    data: UpdateAulaAlunoData
  ) {
    const response = await api.put<AulaAluno>(
      `/aulas/alunos/${aulaAlunoId}`,
      data
    );

    return response.data;
  }

  static async finalizar(id: number) {
    const response = await api.patch<Aula>(
      `/aulas/${id}/finalizar`
    );

    return response.data;
  }

  static async criarProgramada(data: {
    turmaId: number;
    aulaCurriculoId?: number;
    data: string;
    observacoes?: string;
  }) {
    const response = await api.post<AulaProgramada>(
      "/aulas/programadas",
      data
    );

    return response.data;
  }

  static async listarProgramadas() {
    const response = await api.get<AulaProgramada[]>(
      "/aulas/programadas"
    );

    return response.data;
  }

  static async iniciarProgramada(id: number) {
    const response = await api.patch<Aula>(
      `/aulas/programadas/${id}/iniciar`
    );

    return response.data;
  }

  static async atualizar(id: number, data: UpdateAulaData) {
    const response = await api.put<Aula>(`/aulas/${id}`, data);

    return response.data;
  }

  static async excluir(id: number) {
    await api.delete(`/aulas/${id}`);
  }

  static async excluirProgramada(id: number) {
    await api.delete(`/aulas/programadas/${id}`);
  }
}