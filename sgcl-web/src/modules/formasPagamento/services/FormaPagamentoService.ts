import { ApiClient } from "../../../shared/api/ApiClient";
import type { FormaPagamento } from "../types";
import type { FormaPagamentoFormData } from "../schema/formaPagamento.schema";

// Monta o corpo do jeito que o backend espera em
// `prepararConfiguracaoParaGravar`: credencial AUSENTE mantém a que já
// está gravada; credencial com string vazia APAGA. Como a tela nunca
// recebe o valor de volta, o campo em branco significa "não mexi nisso" —
// então ele é omitido, e não enviado vazio. Enviar "" aqui apagaria o
// token do cliente toda vez que alguém salvasse a tela sem redigitá-lo.
function montarCorpo(data: FormaPagamentoFormData) {
  const credenciais: Record<string, string> = {};

  if (data.accessToken?.trim()) credenciais.accessToken = data.accessToken.trim();
  if (data.webhookSecret?.trim()) credenciais.webhookSecret = data.webhookSecret.trim();

  return {
    tipo: data.tipo,
    nomePersonalizado: data.nomePersonalizado || null,
    configuracao: {
      gateway: data.gateway || null,
      ...(Object.keys(credenciais).length > 0 ? { credenciais } : {}),
    },
  };
}

export class FormaPagamentoService {
  static async listar() {
    return ApiClient.get<FormaPagamento[]>("/formas-pagamento");
  }

  static async criar(data: FormaPagamentoFormData) {
    return ApiClient.post<FormaPagamento>("/formas-pagamento", montarCorpo(data));
  }

  static async editar(id: number, data: FormaPagamentoFormData) {
    return ApiClient.put<FormaPagamento>(`/formas-pagamento/${id}`, montarCorpo(data));
  }

  static async alterarStatus(id: number) {
    return ApiClient.patch<FormaPagamento>(`/formas-pagamento/${id}/ativo`);
  }
}
