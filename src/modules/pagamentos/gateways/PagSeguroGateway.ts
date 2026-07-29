import { StubPaymentGateway } from "./StubPaymentGateway";

export class PagSeguroGateway extends StubPaymentGateway {
  readonly nome = "PagSeguro";
}
