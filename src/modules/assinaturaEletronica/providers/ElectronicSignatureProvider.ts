// Camada de abstração de assinatura eletrônica de contrato — mesmo
// espírito de src/modules/pagamentos/gateways/PaymentGateway.ts. Nenhuma
// integração real existe ainda; esta interface e os stubs abaixo existem
// pra que, quando uma integração for implementada, nenhuma regra de
// negócio (RegistrarAssinaturaService e futuros services de Contrato)
// precise mudar: eles sempre conversariam com um
// `ElectronicSignatureProvider`, nunca com o SDK de um provedor específico.

export interface SignatarioDTO {
  nome: string;
  email?: string | null;
  cpf?: string | null;
}

export interface EnviarParaAssinaturaDTO {
  conteudo: string; // texto do contrato (Contrato.conteudoGerado)
  signatarios: SignatarioDTO[];
  referenciaExterna: string; // id do Contrato, usado pra correlacionar o webhook
}

export interface EnviarParaAssinaturaResultado {
  provedorDocumentoId: string;
  linkAssinatura?: string;
  status: string;
}

export interface DocumentoAssinadoResultado {
  url: string;
}

export interface WebhookEventoAssinatura {
  tipo: string;
  referenciaExterna?: string;
  payload: unknown;
}

export interface ElectronicSignatureProvider {
  readonly nome: string;

  enviarParaAssinatura(dados: EnviarParaAssinaturaDTO): Promise<EnviarParaAssinaturaResultado>;
  consultarStatus(provedorDocumentoId: string): Promise<string>;
  cancelarSolicitacao(provedorDocumentoId: string): Promise<void>;
  baixarDocumentoAssinado(provedorDocumentoId: string): Promise<DocumentoAssinadoResultado>;
  processarWebhook(payload: unknown): Promise<WebhookEventoAssinatura>;
}

export class ProvedorAssinaturaNaoImplementadoError extends Error {
  constructor(nomeProvedor: string) {
    super(`Integração com ${nomeProvedor} ainda não implementada.`);
  }
}
