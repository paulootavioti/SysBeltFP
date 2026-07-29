import type {
  CriarAssinaturaDTO,
  CriarAssinaturaResultado,
  CriarCobrancaDTO,
  CriarCobrancaResultado,
  PaymentGateway,
  WebhookEvento,
} from "./PaymentGateway";
import { GatewayNaoImplementadoError } from "./PaymentGateway";

// Base comum pros gateways ainda não integrados — cada provedor (Mercado
// Pago, Asaas, PagSeguro, Stripe, Pagar.me, Stone, Cielo) tem sua própria
// classe (ver os arquivos irmãos), só pra já existir o ponto de extensão
// nomeado onde a integração real vai entrar. Até lá, qualquer chamada
// lança `GatewayNaoImplementadoError` — nunca falha silenciosamente.
export abstract class StubPaymentGateway implements PaymentGateway {
  abstract readonly nome: string;

  async criarCobranca(_dados: CriarCobrancaDTO): Promise<CriarCobrancaResultado> {
    throw new GatewayNaoImplementadoError(this.nome);
  }

  async criarAssinatura(_dados: CriarAssinaturaDTO): Promise<CriarAssinaturaResultado> {
    throw new GatewayNaoImplementadoError(this.nome);
  }

  async cancelarAssinatura(_gatewayAssinaturaId: string): Promise<void> {
    throw new GatewayNaoImplementadoError(this.nome);
  }

  async estornar(_gatewayId: string): Promise<void> {
    throw new GatewayNaoImplementadoError(this.nome);
  }

  async consultarStatus(_gatewayId: string): Promise<string> {
    throw new GatewayNaoImplementadoError(this.nome);
  }

  async processarWebhook(_payload: unknown): Promise<WebhookEvento> {
    throw new GatewayNaoImplementadoError(this.nome);
  }
}
