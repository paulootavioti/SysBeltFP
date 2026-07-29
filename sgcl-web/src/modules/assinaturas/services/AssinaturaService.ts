import { ApiClient } from "../../../shared/api/ApiClient";
import type { Assinatura, ResultadoGeracaoCobrancas, StatusAssinatura } from "../types";
import type { AssinaturaFormData } from "../schema/assinatura.schema";

function montarPayload(data: AssinaturaFormData) {
  return {
    alunoId: Number(data.alunoId),
    planoId: data.planoId ? Number(data.planoId) : null,
    formaPagamentoId: data.formaPagamentoId ? Number(data.formaPagamentoId) : null,
    valor: Number(data.valor),
    diaVencimento: Number(data.diaVencimento),
    dataInicio: data.dataInicio,
    dataFim: data.dataFim || null,
    indeterminado: data.indeterminado,
    numeroParcelas: data.indeterminado ? null : data.numeroParcelas ? Number(data.numeroParcelas) : null,
    desconto: data.desconto ? Number(data.desconto) : 0,
    acrescimo: data.acrescimo ? Number(data.acrescimo) : 0,
    multa: data.multa ? Number(data.multa) : 0,
    juros: data.juros ? Number(data.juros) : 0,
    descontoPontualidade: data.descontoPontualidade ? Number(data.descontoPontualidade) : 0,
  };
}

export class AssinaturaService {
  static async listar() {
    return ApiClient.get<Assinatura[]>("/assinaturas");
  }

  static async criar(data: AssinaturaFormData) {
    return ApiClient.post<Assinatura>("/assinaturas", montarPayload(data));
  }

  static async editar(id: number, data: AssinaturaFormData) {
    return ApiClient.put<Assinatura>(`/assinaturas/${id}`, montarPayload(data));
  }

  static async alterarStatus(id: number, status: StatusAssinatura) {
    return ApiClient.patch<Assinatura>(`/assinaturas/${id}/status`, { status });
  }

  static async gerarCobrancasAgora() {
    return ApiClient.post<ResultadoGeracaoCobrancas>("/assinaturas/gerar-cobrancas", {});
  }
}
