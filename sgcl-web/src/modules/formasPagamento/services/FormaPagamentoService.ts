import { ApiClient } from "../../../shared/api/ApiClient";
import type { FormaPagamento } from "../types";
import type { FormaPagamentoFormData } from "../schema/formaPagamento.schema";

export class FormaPagamentoService {
  static async listar() {
    return ApiClient.get<FormaPagamento[]>("/formas-pagamento");
  }

  static async criar(data: FormaPagamentoFormData) {
    return ApiClient.post<FormaPagamento>("/formas-pagamento", {
      tipo: data.tipo,
      nomePersonalizado: data.nomePersonalizado || null,
    });
  }

  static async editar(id: number, data: FormaPagamentoFormData) {
    return ApiClient.put<FormaPagamento>(`/formas-pagamento/${id}`, {
      tipo: data.tipo,
      nomePersonalizado: data.nomePersonalizado || null,
    });
  }

  static async alterarStatus(id: number) {
    return ApiClient.patch<FormaPagamento>(`/formas-pagamento/${id}/ativo`);
  }
}
