import { ApiClient } from "../../../shared/api/ApiClient";
import type { Competicao, Atleta } from "../types/competicao";
import type { CompeticaoFormData } from "../schema/competicao.schema";

export class CompeticaoService {
  static async listar() {
    return ApiClient.get<Competicao[]>("/competicoes");
  }

  static async criar(data: CompeticaoFormData) {
    return ApiClient.post<Competicao>("/competicoes", data);
  }

  static async listarAtletas(competicaoId: number) {
    return ApiClient.get<Atleta[]>(`/competicoes/${competicaoId}/atletas`);
  }

  static async inscrever(competicaoId: number, alunoId: number) {
    return ApiClient.post<Atleta>("/competicoes/inscricao", {
      competicaoId,
      alunoId,
    });
  }

  static async registrarResultado(id: number, resultado: string) {
    return ApiClient.patch<Atleta>(`/competicoes/inscricao/${id}`, {
      resultado,
    });
  }
}