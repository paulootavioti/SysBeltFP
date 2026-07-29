import type { TipoFormaPagamento } from "@prisma/client";

import type { PaymentGateway } from "./PaymentGateway";
import { NullPaymentGateway } from "./NullPaymentGateway";
import { MercadoPagoGateway } from "./MercadoPagoGateway";
import { AsaasGateway } from "./AsaasGateway";
import { PagSeguroGateway } from "./PagSeguroGateway";
import { StripeGateway } from "./StripeGateway";
import { PagarMeGateway } from "./PagarMeGateway";
import { StoneGateway } from "./StoneGateway";
import { CieloGateway } from "./CieloGateway";

export type { PaymentGateway } from "./PaymentGateway";
export { GatewayNaoImplementadoError } from "./PaymentGateway";

// Nome do gateway configurado em `FormaPagamento.configuracao.gateway` —
// quando ausente (o caso hoje, sempre), cai no NullPaymentGateway (manual).
export type NomeGateway =
  | "MERCADO_PAGO"
  | "ASAAS"
  | "PAGSEGURO"
  | "STRIPE"
  | "PAGARME"
  | "STONE"
  | "CIELO";

const GATEWAYS: Record<NomeGateway, () => PaymentGateway> = {
  MERCADO_PAGO: () => new MercadoPagoGateway(),
  ASAAS: () => new AsaasGateway(),
  PAGSEGURO: () => new PagSeguroGateway(),
  STRIPE: () => new StripeGateway(),
  PAGARME: () => new PagarMeGateway(),
  STONE: () => new StoneGateway(),
  CIELO: () => new CieloGateway(),
};

// Ponto único de escolha do gateway — services de negócio chamam só esta
// função, nunca instanciam um gateway concreto diretamente. Formas de
// pagamento manuais (Dinheiro, Transferência) e qualquer forma sem
// `configuracao.gateway` definido usam o gateway manual.
export function obterGateway(
  _tipo: TipoFormaPagamento,
  nomeGateway?: string | null
): PaymentGateway {
  if (!nomeGateway) {
    return new NullPaymentGateway();
  }

  const fabrica = GATEWAYS[nomeGateway as NomeGateway];

  return fabrica ? fabrica() : new NullPaymentGateway();
}
