import { StubPaymentGateway } from "./StubPaymentGateway";

export class MercadoPagoGateway extends StubPaymentGateway {
  readonly nome = "Mercado Pago";
}
