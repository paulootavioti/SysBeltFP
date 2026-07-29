import { StubPaymentGateway } from "./StubPaymentGateway";

export class PagarMeGateway extends StubPaymentGateway {
  readonly nome = "Pagar.me";
}
