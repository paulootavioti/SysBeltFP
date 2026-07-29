import { randomUUID } from "crypto";

import type {
  CriarAssinaturaDTO,
  CriarAssinaturaResultado,
  CriarCobrancaDTO,
  CriarCobrancaResultado,
  PaymentGateway,
  WebhookEvento,
} from "./PaymentGateway";

// Gateway "manual" — é o que roda hoje na prática: Dinheiro, Transferência
// e qualquer forma sem integração automática são confirmadas à mão pelo
// Administrador (PagarMensalidadeService), sem nenhum provedor externo.
// É o gateway padrão de todas as formas de pagamento até que uma
// integração real seja configurada em `FormaPagamento.configuracao`.
export class NullPaymentGateway implements PaymentGateway {
  readonly nome = "Manual";

  async criarCobranca(dados: CriarCobrancaDTO): Promise<CriarCobrancaResultado> {
    return {
      gatewayId: `manual-${randomUUID()}`,
      status: "AGUARDANDO_CONFIRMACAO_MANUAL",
      linkPagamento: undefined,
    };
  }

  async criarAssinatura(dados: CriarAssinaturaDTO): Promise<CriarAssinaturaResultado> {
    return {
      gatewayAssinaturaId: `manual-${randomUUID()}`,
      status: "ATIVA",
    };
  }

  async cancelarAssinatura(): Promise<void> {
    // nada a fazer — não há provedor externo pra avisar.
  }

  async estornar(): Promise<void> {
    // estorno manual é só o registro no sistema (EstornarMensalidadeService).
  }

  async consultarStatus(): Promise<string> {
    return "AGUARDANDO_CONFIRMACAO_MANUAL";
  }

  async processarWebhook(payload: unknown): Promise<WebhookEvento> {
    return { tipo: "NAO_APLICAVEL", payload };
  }
}
