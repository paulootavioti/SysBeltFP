import { ApiClient } from "../../../shared/api/ApiClient";

interface RelatorioComMensagem {
  mensagem: string;
}

export class RelatorioService {
  static async financeiro() {
    return ApiClient.get<RelatorioComMensagem>("/relatorios/financeiro");
  }

  static async ranking() {
    return ApiClient.get<RelatorioComMensagem>("/relatorios/ranking");
  }

  static async aniversariantes() {
    return ApiClient.get<RelatorioComMensagem>("/relatorios/aniversariantes");
  }

  static async evolucao(alunoId: number) {
    return ApiClient.get<RelatorioComMensagem>(`/relatorios/evolucao/${alunoId}`);
  }

  static async comportamental(alunoId: number) {
    return ApiClient.get<RelatorioComMensagem>(`/relatorios/comportamental/${alunoId}`);
  }
}