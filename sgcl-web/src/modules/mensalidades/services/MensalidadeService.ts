import { ApiClient } from "../../../shared/api/ApiClient";
import type { Mensalidade, MensalidadeComAluno } from "../types";
import type { MensalidadeFormData } from "../schema/mensalidade.schema";

export interface HistoricoFinanceiroAluno {
  aluno: { id: number; nome: string };
  mensalidades: MensalidadeComAluno[];
  auditoria: {
    id: number;
    operacao: string;
    createdAt: string;
    usuario: { id: number; nome: string };
    valoresAntes?: unknown;
    valoresDepois?: unknown;
  }[];
}

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
      descricao: data.descricao || null,
      formaPagamentoId: data.formaPagamentoId ? Number(data.formaPagamentoId) : null,
      desconto: data.desconto ? Number(data.desconto) : 0,
      acrescimo: data.acrescimo ? Number(data.acrescimo) : 0,
      multa: data.multa ? Number(data.multa) : 0,
      juros: data.juros ? Number(data.juros) : 0,
    });
  }

  static async marcarComoPago(id: number, formaPagamentoId?: number | null) {
    return ApiClient.patch<Mensalidade>(`/mensalidades/${id}/pagar`, {
      formaPagamentoId: formaPagamentoId ?? null,
    });
  }

  static async cancelar(id: number, motivo: string) {
    return ApiClient.patch<Mensalidade>(`/mensalidades/${id}/cancelar`, { motivo });
  }

  static async estornar(id: number, motivo: string) {
    return ApiClient.patch<Mensalidade>(`/mensalidades/${id}/estornar`, { motivo });
  }

  static async registrarComprovante(id: number, comprovanteUrl: string) {
    return ApiClient.post<Mensalidade>(`/mensalidades/${id}/comprovante`, { comprovanteUrl });
  }

  static async historicoAluno(alunoId: number) {
    return ApiClient.get<HistoricoFinanceiroAluno>(`/mensalidades/aluno/${alunoId}/historico`);
  }

  static async listarVencidas() {
    return ApiClient.get<MensalidadeComAluno[]>("/mensalidades/vencidas");
  }
}
