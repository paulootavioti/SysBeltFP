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
  // PIX e boleto exigem identificar o pagador. Opcional no contrato
  // porque o gateway manual não precisa — mas os reais recusam sem.
  pagador?: { email?: string | null; nome?: string | null } | null;
}

export interface CriarCobrancaResultado {
  gatewayId: string;
  linkPagamento?: string;
  status: string;
  // PIX: o "copia e cola" e a mesma informação como imagem, pra tela do
  // Portal da Família mostrar o QR sem depender de gerar a imagem.
  pixCopiaECola?: string;
  pixQrCodeBase64?: string;
  expiraEm?: Date | null;
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
  // id do evento no gateway — chave de idempotência do recebimento.
  eventoExternoId?: string;
  // id do recurso (pagamento) no gateway.
  recursoId?: string;
  // status já normalizado pelo gateway: o que a aplicação deve fazer.
  situacao?: "PAGO" | "PENDENTE" | "RECUSADO" | "ESTORNADO" | "DESCONHECIDO";
  valorPago?: number;
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
