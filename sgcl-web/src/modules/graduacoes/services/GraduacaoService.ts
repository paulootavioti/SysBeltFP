import { ApiClient } from "../../../shared/api/ApiClient";
import type { Graduacao, EvolucaoAluno, AlunoElegivel } from "../types";
import type { GraduacaoFormData } from "../schema/graduacao.schema";

function montarCobranca(data: GraduacaoFormData) {
  if (!data.gerarCobranca) return undefined;

  return {
    valor: Number(data.valorCobranca),
    vencimento: data.vencimentoCobranca,
  };
}

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

  // traz todo mundo (não só quem já está apto), com o progresso calculado —
  // usado pela tela "Próximas Graduações" pra mostrar a barra de progresso
  // mesmo de quem ainda não chegou lá.
  static async listarProgressoGraduacoes() {
    return ApiClient.get<AlunoElegivel[]>("/graduacoes/proximas?todos=true");
  }

  static async criar(data: GraduacaoFormData) {
    if (data.tipo === "GRAU") {
      return ApiClient.post("/graduacoes/grau", {
        alunoId: Number(data.alunoId),
        cobranca: montarCobranca(data),
      });
    }

    return ApiClient.post<Graduacao>("/graduacoes", {
      alunoId: Number(data.alunoId),
      faixa: data.faixa,
      data: data.data,
      cobranca: montarCobranca(data),
    });
  }
}
