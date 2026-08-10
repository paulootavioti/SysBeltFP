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
import { lerCredenciaisGateway, nomeDoGateway, type CredenciaisGateway } from "./credenciais";

export type { PaymentGateway } from "./PaymentGateway";
export { GatewayNaoImplementadoError } from "./PaymentGateway";
export {
  lerCredenciaisGateway,
  nomeDoGateway,
  prepararConfiguracaoParaGravar,
  resumirConfiguracao,
} from "./credenciais";
export type { CredenciaisGateway, ResumoConfiguracao } from "./credenciais";

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

const GATEWAYS: Record<NomeGateway, (credenciais: CredenciaisGateway) => PaymentGateway> = {
  MERCADO_PAGO: (credenciais) => new MercadoPagoGateway(credenciais),
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
//
// Recebe a `configuracao` inteira da FormaPagamento, não só o nome: é dela
// que saem as credenciais da unidade, decifradas na hora do uso. Assim a
// escolha do gateway E a conta usada pra cobrar pertencem ao assinante.
// Recebe a `configuracao` da FormaPagamento (o Json inteiro), nunca só o
// nome do gateway: é dela que saem as credenciais da unidade. Aceitar o
// nome solto abriria a porta pra cair calado nas credenciais do ambiente
// e cobrar na conta do assinante errado.
export function obterGateway(
  _tipo: TipoFormaPagamento,
  configuracao?: unknown
): PaymentGateway {
  const nomeGateway = nomeDoGateway(configuracao);

  if (!nomeGateway) {
    return new NullPaymentGateway();
  }

  const fabrica = GATEWAYS[nomeGateway as NomeGateway];

  if (!fabrica) return new NullPaymentGateway();

  // Só lê (e decifra) credencial quando o gateway realmente precisa dela.
  return fabrica(lerCredenciaisGateway(configuracao));
}
