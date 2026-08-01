import { api } from "../../../services/api";
import type {
  Agenda,
  Frequencia,
  Mensagem,
  Mensalidade,
  Resumo,
  ResultadoPagamento,
} from "../types";

export class PortalService {
  static async resumo(alunoId: number) {
    const response = await api.get<Resumo>(`/portal-familia/resumo/${alunoId}`);
    return response.data;
  }

  static async frequencia(alunoId: number) {
    const response = await api.get<Frequencia[]>(`/portal-familia/frequencia/${alunoId}`);
    return response.data;
  }

  static async mensalidades(alunoId: number) {
    const response = await api.get<Mensalidade[]>(`/portal-familia/mensalidades/${alunoId}`);
    return response.data;
  }

  static async pagarMensalidade(mensalidadeId: number, alunoId: number) {
    const response = await api.post<ResultadoPagamento>(`/portal-familia/mensalidades/${mensalidadeId}/pagar`, {
      alunoId,
    });
    return response.data;
  }

  static async agenda(alunoId: number) {
    const response = await api.get<Agenda[]>(`/portal-familia/agenda/${alunoId}`);
    return response.data;
  }

  static async listarMensagens(alunoId: number) {
    const response = await api.get<Mensagem[]>(`/portal-familia/mensagens/${alunoId}`);
    return response.data;
  }

  static async enviarMensagem(alunoId: number, texto: string) {
    const response = await api.post<Mensagem>("/portal-familia/mensagens", { alunoId, texto });
    return response.data;
  }
}
