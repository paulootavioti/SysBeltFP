// Camada de abstração de gateway de pagamento. Nenhuma integração real
// existe ainda (ver README/roadmap) — esta interface e os stubs abaixo
// existem pra que, quando uma integração for implementada, nenhuma regra
// de negócio (services de Mensalidade/Assinatura/Financeiro) precise
// mudar: eles sempre conversam com um `PaymentGateway`, nunca com o SDK
// de um provedor específico.

export interface CriarCobrancaDTO {
  valor: number;
  vencimento: Date;
  descricao?: string | null;
  referenciaExterna: string; // id da Mensalidade, usado pra correlacionar o webhook
}

export interface CriarCobrancaResultado {
  gatewayId: string;
  linkPagamento?: string;
  status: string;
}

export interface CriarAssinaturaDTO {
  valor: number;
  diaVencimento: number;
  referenciaExterna: string; // id da Assinatura
}

export interface CriarAssinaturaResultado {
  gatewayAssinaturaId: string;
  status: string;
}

export interface WebhookEvento {
  tipo: string;
  referenciaExterna?: string;
  payload: unknown;
}

export interface PaymentGateway {
  readonly nome: string;

  criarCobranca(dados: CriarCobrancaDTO): Promise<CriarCobrancaResultado>;
  criarAssinatura(dados: CriarAssinaturaDTO): Promise<CriarAssinaturaResultado>;
  cancelarAssinatura(gatewayAssinaturaId: string): Promise<void>;
  estornar(gatewayId: string): Promise<void>;
  consultarStatus(gatewayId: string): Promise<string>;
  processarWebhook(payload: unknown): Promise<WebhookEvento>;
}

export class GatewayNaoImplementadoError extends Error {
  constructor(nomeGateway: string) {
    super(`Integração com ${nomeGateway} ainda não implementada.`);
  }
}
