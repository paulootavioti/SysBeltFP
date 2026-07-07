import { ApiClient } from "../../../shared/api/ApiClient";
import type { Graduacao, EvolucaoAluno, AlunoElegivel } from "../types";
import type { GraduacaoFormData } from "../schema/graduacao.schema";

export class GraduacaoService {
  static async listar() {
    return ApiClient.get<Graduacao[]>("/graduacoes");
  }

  static async buscarPorAluno(alunoId: number) {
    return ApiClient.get<Graduacao[]>(`/graduacoes/aluno/${alunoId}`);
  }

  static async getEvolucao(alunoId: number) {
    return ApiClient.get<EvolucaoAluno>(`/graduacoes/evolucao/${alunoId}`);
  }

  static async listarProximas() {
    return ApiClient.get<AlunoElegivel[]>("/graduacoes/proximas");
  }

  static async criar(data: GraduacaoFormData) {
    return ApiClient.post<Graduacao>("/graduacoes", {
      alunoId: Number(data.alunoId),
      faixa: data.faixa,
      data: data.data,
    });
  }
}
