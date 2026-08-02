import { ApiClient } from "../../../shared/api/ApiClient";
import type { ConversaFamiliaResumo, MensagemFamilia } from "../types";

export class MensagemFamiliaService {
  static async listar(alunoId: number) {
    return ApiClient.get<MensagemFamilia[]>(`/mensagens-familia?alunoId=${alunoId}`);
  }

  static async enviar(alunoId: number, texto: string) {
    return ApiClient.post<MensagemFamilia>("/mensagens-familia", { alunoId, texto });
  }

  static async listarConversas() {
    return ApiClient.get<ConversaFamiliaResumo[]>("/mensagens-familia/conversas");
  }
}
