import { ApiClient } from "../../../shared/api/ApiClient";
import type { Contrato, SituacaoContrato, TipoAssinaturaContrato } from "../types";
import type { ContratoFormData } from "../schema/contrato.schema";

function montarPayload(data: ContratoFormData) {
  return {
    alunoId: Number(data.alunoId),
    modeloContratoId: Number(data.modeloContratoId),
    planoId: data.planoId ? Number(data.planoId) : null,
    formaPagamentoId: data.formaPagamentoId ? Number(data.formaPagamentoId) : null,
    valor: Number(data.valor),
    dataInicioVigencia: data.dataInicioVigencia,
    dataFimVigencia: data.dataFimVigencia || null,
    regrasCancelamento: data.regrasCancelamento || null,
    clausulas: data.clausulas || null,
    renovacaoAutomatica: data.renovacaoAutomatica,
  };
}

export class ContratoService {
  static async listar(filtros?: { alunoId?: number; situacao?: SituacaoContrato }) {
    const params = new URLSearchParams();
    if (filtros?.alunoId) params.set("alunoId", String(filtros.alunoId));
    if (filtros?.situacao) params.set("situacao", filtros.situacao);
    const query = params.toString();

    return ApiClient.get<Contrato[]>(`/contratos${query ? `?${query}` : ""}`);
  }

  static async buscar(id: number) {
    return ApiClient.get<Contrato>(`/contratos/${id}`);
  }

  static async criar(data: ContratoFormData) {
    return ApiClient.post<Contrato>("/contratos", montarPayload(data));
  }

  static async editar(id: number, data: ContratoFormData) {
    return ApiClient.put<Contrato>(`/contratos/${id}`, montarPayload(data));
  }

  static async alterarSituacao(id: number, situacao: SituacaoContrato, motivoCancelamento?: string) {
    return ApiClient.patch<Contrato>(`/contratos/${id}/situacao`, { situacao, motivoCancelamento });
  }

  static async assinar(id: number, tipoAssinatura: TipoAssinaturaContrato, contratoAssinadoUrl?: string) {
    return ApiClient.post<Contrato>(`/contratos/${id}/assinar`, { tipoAssinatura, contratoAssinadoUrl });
  }

  static async renovar(id: number, dados?: { dataInicioVigencia?: string; dataFimVigencia?: string; valor?: number }) {
    return ApiClient.post<Contrato>(`/contratos/${id}/renovar`, dados ?? {});
  }
}
