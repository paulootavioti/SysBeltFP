import { api } from "../../../services/api";
import type {
  TurmaResumo,
  TurmaDetalhada,
  Curriculo,
  ProntuarioProfessor,
  AlunoElegivel,
} from "../types-academico";

// Reaproveita os MESMOS endpoints usados pelo sgcl-web (mesmo backend, mesmo
// token já autenticado neste app) — sem rota nova e sem segundo login. O
// professor só vê o que já é permitido a ele no backend (turmas, prontuário
// e graduações das próprias turmas).
export class AcademicoService {
  static async listarTurmas() {
    const response = await api.get<TurmaResumo[]>("/turmas");
    return response.data;
  }

  static async buscarTurma(id: number) {
    const response = await api.get<TurmaDetalhada>(`/turmas/${id}`);
    return response.data;
  }

  static async listarCurriculos() {
    const response = await api.get<Curriculo[]>("/curriculos");
    return response.data;
  }

  static async prontuario(alunoId: number) {
    const response = await api.get<ProntuarioProfessor>(`/alunos/${alunoId}/prontuario`);
    return response.data;
  }

  static async listarProgressoGraduacoes() {
    const response = await api.get<AlunoElegivel[]>("/graduacoes/proximas?todos=true");
    return response.data;
  }

  static async solicitarGraduacao(data: { alunoId: number; faixa: string; comentario?: string }) {
    const response = await api.post("/graduacoes/solicitar", data);
    return response.data;
  }
}
