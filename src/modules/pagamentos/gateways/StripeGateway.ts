import { StubPaymentGateway } from "./StubPaymentGateway";

export class StripeGateway extends StubPaymentGateway {
  readonly nome = "Stripe";
}
