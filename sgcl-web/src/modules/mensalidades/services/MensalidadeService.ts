import { ApiClient } from "../../../shared/api/ApiClient";
import type { Mensalidade, MensalidadeComAluno } from "../types";
import type { MensalidadeFormData } from "../schema/mensalidade.schema";

export class MensalidadeService {
  static async listar() {
    return ApiClient.get<MensalidadeComAluno[]>("/mensalidades");
  }

  static async buscar(id: number) {
    return ApiClient.get<MensalidadeComAluno>(`/mensalidades/${id}`);
  }

  static async criar(data: MensalidadeFormData) {
    return ApiClient.post<Mensalidade>("/mensalidades", {
      alunoId: Number(data.alunoId),
      valor: Number(data.valor),
      vencimento: data.vencimento,
      dataPagamento: data.dataPagamento || null,
      pago: data.pago,
    });
  }

  static async marcarComoPago(id: number) {
    return ApiClient.patch<Mensalidade>(`/mensalidades/${id}/pagar`);
  }

  static async listarVencidas() {
    return ApiClient.get<MensalidadeComAluno[]>("/mensalidades/vencidas");
  }
}
