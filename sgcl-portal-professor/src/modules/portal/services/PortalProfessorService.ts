import { api } from "../../../services/api";
import type { AulasHojeResponse, AulaDetalhe, ResumoAula, FotoTreino } from "../types";

export class PortalProfessorService {
  static async hoje() {
    const response = await api.get<AulasHojeResponse>("/portal-professor/hoje");
    return response.data;
  }

  // não é uma rota /portal-professor/* — reaproveita o endpoint já
  // existente do módulo de aulas (mesmo usado pelo sgcl-web) que
  // transforma a AulaProgramada de hoje numa Aula de verdade (chamada
  // aberta), retornando o id que o app usa pra entrar no Modo Aula.
  static async iniciarAulaProgramada(aulaProgramadaId: number) {
    const response = await api.patch<{ id: number }>(`/aulas/programadas/${aulaProgramadaId}/iniciar`);
    return response.data;
  }

  static async aula(id: number) {
    const response = await api.get<AulaDetalhe>(`/portal-professor/aulas/${id}`);
    return response.data;
  }

  static async marcarPresenca(aulaId: number, alunoId: number, presente: boolean) {
    const response = await api.post(`/portal-professor/aulas/${aulaId}/presenca`, { alunoId, presente });
    return response.data;
  }

  static async marcarTecnica(aulaId: number, tecnicaId: number, executada: boolean) {
    const response = await api.post(`/portal-professor/aulas/${aulaId}/tecnicas`, { tecnicaId, executada });
    return response.data;
  }

  static async criarNota(aulaId: number, alunoId: number, dados: { tag?: string; texto?: string }) {
    const response = await api.post(`/portal-professor/aulas/${aulaId}/notas`, { alunoId, ...dados });
    return response.data;
  }

  static async registrarObservacao(aulaId: number, texto: string) {
    const response = await api.post(`/portal-professor/aulas/${aulaId}/observacao`, { texto });
    return response.data;
  }

  static async publicarFoto(aulaId: number, arquivo: File, legenda: string, visivelNaLanding: boolean) {
    const formData = new FormData();
    formData.append("arquivo", arquivo);
    formData.append("legenda", legenda);
    formData.append("visivelNaLanding", String(visivelNaLanding));

    const response = await api.post(`/portal-professor/aulas/${aulaId}/foto`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  }

  // não é uma rota /portal-professor/* — reaproveita o módulo fotosTreino
  // (mesmo usado pela Chamada do sgcl-web), que já restringe o professor às
  // fotos das próprias turmas.
  static async listarFotos(aulaId: number) {
    const response = await api.get<FotoTreino[]>("/fotos-treino", { params: { aulaId } });
    return response.data;
  }

  static async finalizar(aulaId: number, observacoes?: string) {
    const response = await api.post<ResumoAula>(`/portal-professor/aulas/${aulaId}/finalizar`, { observacoes });
    return response.data;
  }
}
