import { AppError } from "../../../shared/errors/AppError";
import type {
  CriarAssinaturaDTO,
  CriarAssinaturaResultado,
  CriarCobrancaDTO,
  CriarCobrancaResultado,
  PaymentGateway,
  WebhookEvento,
} from "./PaymentGateway";
import { GatewayNaoImplementadoError } from "./PaymentGateway";
import {
  consultarPagamento,
  criarPagamentoPix,
  estornarPagamento,
  type PagamentoMercadoPago,
} from "./mercadoPago/clienteMercadoPago";

// Tradução dos status do Mercado Pago pro vocabulário do sistema. O que
// interessa à mensalidade é "posso dar baixa?", e só `approved` responde
// sim: `in_process` e `authorized` são dinheiro que ainda não entrou.
function traduzirStatus(status: string): NonNullable<WebhookEvento["situacao"]> {
  switch (status) {
    case "approved":
      return "PAGO";
    case "pending":
    case "in_process":
    case "authorized":
      return "PENDENTE";
    case "rejected":
    case "cancelled":
      return "RECUSADO";
    case "refunded":
    case "charged_back":
      return "ESTORNADO";
    default:
      return "DESCONHECIDO";
  }
}

export class MercadoPagoGateway implements PaymentGateway {
  readonly nome = "Mercado Pago";

  async criarCobranca(dados: CriarCobrancaDTO): Promise<CriarCobrancaResultado> {
    const email = dados.pagador?.email;

    if (!email) {
      // O Mercado Pago recusa PIX sem e-mail do pagador. Falhar aqui, com
      // texto claro, é melhor que deixar o erro cru do gateway subir.
      throw new AppError(
        "Para gerar o PIX é preciso ter o e-mail do aluno ou do responsável cadastrado."
      );
    }

    const pagamento = await criarPagamentoPix({
      valor: dados.valor,
      descricao: dados.descricao ?? "Mensalidade",
      referenciaExterna: dados.referenciaExterna,
      expiraEm: dados.vencimento,
      pagador: { email, nome: dados.pagador?.nome },
    });

    const transacao = pagamento.point_of_interaction?.transaction_data;

    return {
      gatewayId: String(pagamento.id),
      status: pagamento.status,
      linkPagamento: transacao?.ticket_url,
      pixCopiaECola: transacao?.qr_code,
      pixQrCodeBase64: transacao?.qr_code_base64,
      expiraEm: pagamento.date_of_expiration ? new Date(pagamento.date_of_expiration) : null,
    };
  }

  async criarAssinatura(_dados: CriarAssinaturaDTO): Promise<CriarAssinaturaResultado> {
    // Recorrência no Mercado Pago é outra API (preapproval), com fluxo de
    // autorização próprio do pagador. Falha explícita em vez de fingir
    // que a assinatura foi criada — ver roadmap.
    throw new GatewayNaoImplementadoError("Mercado Pago (assinatura recorrente)");
  }

  async cancelarAssinatura(): Promise<void> {
    throw new GatewayNaoImplementadoError("Mercado Pago (assinatura recorrente)");
  }

  async estornar(gatewayId: string): Promise<void> {
    await estornarPagamento(gatewayId);
  }

  async consultarStatus(gatewayId: string): Promise<string> {
    const pagamento = await consultarPagamento(gatewayId);

    return pagamento.status;
  }

  // A notificação do Mercado Pago avisa QUE algo mudou, mas o payload dela
  // não é fonte confiável do status: quem manda é a API. Por isso aqui a
  // gente relê o pagamento antes de decidir qualquer coisa — é o que
  // impede um payload forjado (ou desatualizado) de dar baixa indevida.
  async processarWebhook(payload: unknown): Promise<WebhookEvento> {
    const notificacao = (payload ?? {}) as {
      id?: number | string;
      type?: string;
      action?: string;
      data?: { id?: number | string };
    };

    const recursoId = notificacao.data?.id ? String(notificacao.data.id) : undefined;
    const tipo = notificacao.type ?? notificacao.action ?? "desconhecido";

    if (!recursoId || !tipo.startsWith("payment")) {
      return { tipo, payload, eventoExternoId: notificacao.id ? String(notificacao.id) : undefined };
    }

    const pagamento: PagamentoMercadoPago = await consultarPagamento(recursoId);

    return {
      tipo,
      payload,
      eventoExternoId: notificacao.id ? String(notificacao.id) : `payment-${recursoId}`,
      recursoId,
      referenciaExterna: pagamento.external_reference ?? undefined,
      situacao: traduzirStatus(pagamento.status),
      valorPago: pagamento.transaction_amount,
    };
  }
}
