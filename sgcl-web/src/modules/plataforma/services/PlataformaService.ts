import { ApiClient } from "../../../shared/api/ApiClient";
import type {
  ContaResumo,
  MinhaAssinatura,
  PlanoPlataforma,
  ResultadoFechamento,
  StatusAssinaturaPlataforma,
} from "../types";

export interface NovaContaDTO {
  nome: string;
  documento?: string | null;
  emailCobranca?: string | null;
  nomePrimeiraUnidade?: string | null;
  planoId: number;
  diaVencimento?: number;
  diasDeTeste?: number;
}

export interface AlterarAssinaturaDTO {
  planoId?: number;
  status?: StatusAssinaturaPlataforma;
  precoPorBlocoCentavos?: number | null;
  diaVencimento?: number;
}

export interface PlanoDTO {
  nome: string;
  descricao?: string | null;
  alunosPorBloco: number;
  precoPorBlocoCentavos: number;
  blocosMinimos?: number;
  recursos?: string[];
}

export class PlataformaService {
  // ---- dono da academia ----
  static async minhaAssinatura() {
    return ApiClient.get<MinhaAssinatura>("/plataforma/minha-assinatura");
  }

  // ---- operador da plataforma ----
  static async listarContas() {
    return ApiClient.get<ContaResumo[]>("/plataforma/contas");
  }

  static async detalharConta(contaId: number) {
    return ApiClient.get<MinhaAssinatura>(`/plataforma/contas/${contaId}`);
  }

  static async criarConta(data: NovaContaDTO) {
    return ApiClient.post<unknown>("/plataforma/contas", data);
  }

  static async alterarAssinatura(contaId: number, data: AlterarAssinaturaDTO) {
    return ApiClient.patch<unknown>(`/plataforma/contas/${contaId}/assinatura`, data);
  }

  static async listarPlanos() {
    return ApiClient.get<PlanoPlataforma[]>("/plataforma/planos");
  }

  static async criarPlano(data: PlanoDTO) {
    return ApiClient.post<PlanoPlataforma>("/plataforma/planos", data);
  }

  static async editarPlano(id: number, data: PlanoDTO) {
    return ApiClient.put<PlanoPlataforma>(`/plataforma/planos/${id}`, data);
  }

  static async fecharMes() {
    return ApiClient.post<ResultadoFechamento>("/plataforma/faturas/fechamento", {});
  }

  static async marcarFaturaPaga(faturaId: number) {
    return ApiClient.patch<unknown>(`/plataforma/faturas/${faturaId}/pago`);
  }
}
