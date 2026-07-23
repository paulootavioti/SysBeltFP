import { api } from "../../../services/api";

import type { Aula, AulaAluno, AulaProgramada, ItemGradeSemanal, PeriodoContagem, ResumoTurmaAulas } from "../types";
import type { MensagemGerada } from "../../mensagens/types/mensagem";

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

interface UpdateAulaProgramadaData {
  data?: string;
  aulaCurriculoId?: number | null;
  observacoes?: string | null;
}

interface ReplicarProgramacaoData {
  turmaId: number;
  aulaCurriculoId?: number;
  dataInicio: string;
  dataFim: string;
  diasSemana: number[];
  observacoes?: string;
}

interface ListaFiltros {
  turmaId?: number;
  periodo?: PeriodoContagem;
}

function montarQuery(filtros?: ListaFiltros) {
  if (!filtros) return "";

  const params = new URLSearchParams();
  if (filtros.turmaId) params.set("turmaId", String(filtros.turmaId));
  if (filtros.periodo) params.set("periodo", filtros.periodo);

  const query = params.toString();
  return query ? `?${query}` : "";
}

export class AulaService {
  static async listar(filtros?: ListaFiltros) {
    const response = await api.get<Aula[]>(`/aulas${montarQuery(filtros)}`);

    return response.data;
  }

  static async resumoTurmas(periodo: PeriodoContagem) {
    const response = await api.get<ResumoTurmaAulas[]>(`/aulas/resumo-turmas?periodo=${periodo}`);

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

  static async replicarProgramada(data: ReplicarProgramacaoData) {
    const response = await api.post<{ criadas: number; ignoradasPorDuplicidade: number }>(
      "/aulas/programadas/replicar",
      data
    );

    return response.data;
  }

  static async listarProgramadas(filtros?: ListaFiltros) {
    const response = await api.get<AulaProgramada[]>(
      `/aulas/programadas${montarQuery(filtros)}`
    );

    return response.data;
  }

  static async resumoTurmasProgramadas(periodo: PeriodoContagem) {
    const response = await api.get<ResumoTurmaAulas[]>(
      `/aulas/programadas/resumo-turmas?periodo=${periodo}`
    );

    return response.data;
  }

  static async iniciarProgramada(id: number) {
    const response = await api.patch<Aula>(
      `/aulas/programadas/${id}/iniciar`
    );

    return response.data;
  }

  static async atualizarProgramada(id: number, data: UpdateAulaProgramadaData) {
    const response = await api.put<AulaProgramada>(
      `/aulas/programadas/${id}`,
      data
    );

    return response.data;
  }

  static async cancelarProgramada(id: number) {
    const response = await api.patch<{ programacao: AulaProgramada; avisos: MensagemGerada[] }>(
      `/aulas/programadas/${id}/cancelar`
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

  static async gradeSemanal() {
    const response = await api.get<ItemGradeSemanal[]>("/aulas/grade-semanal");

    return response.data;
  }
}
