import { Prisma } from "@prisma/client";

import { prismaDaRequisicao } from "../../../shared/database/prismaDaRequisicao";
import { AuditLogService } from "../../../shared/services/AuditLogService";
import type { PaymentGateway, WebhookEvento } from "../gateways/PaymentGateway";

const auditLogService = new AuditLogService();

export type ResultadoWebhook =
  | "PAGAMENTO_REGISTRADO"
  | "JA_PROCESSADO"
  | "IGNORADO"
  | "MENSALIDADE_NAO_ENCONTRADA";

interface ReceberWebhookDTO {
  gateway: PaymentGateway;
  nomeGateway: string;
  payload: unknown;
}

export class ReceberWebhookPagamentoService {
  private nomeGateway = "";

  async execute({ gateway, nomeGateway, payload }: ReceberWebhookDTO): Promise<{
    resultado: ResultadoWebhook;
    detalhe?: string;
  }> {
    const prisma = prismaDaRequisicao();
    this.nomeGateway = nomeGateway;

    // O gateway relê o pagamento na API dele antes de responder — o
    // payload da notificação nunca é fonte de verdade do status.
    const evento = await gateway.processarWebhook(payload);

    const chave = evento.eventoExternoId;

    if (!chave) {
      return { resultado: "IGNORADO", detalhe: "Notificação sem identificador de evento." };
    }

    // Reserva a chave ANTES de aplicar o efeito. Se dois webhooks do mesmo
    // evento chegarem em paralelo, o índice único deixa só um passar —
    // fazer a checagem com um findFirst antes teria janela de corrida.
    let registro;

    try {
      registro = await prisma.eventoWebhookPagamento.create({
        data: {
          gateway: nomeGateway,
          eventoExternoId: chave,
          tipo: evento.tipo,
          recursoId: evento.recursoId ?? null,
          payload: (payload ?? {}) as Prisma.InputJsonValue,
        },
      });
    } catch (erro) {
      if (
        erro instanceof Prisma.PrismaClientKnownRequestError &&
        erro.code === "P2002"
      ) {
        // Gateway reenvia notificação sempre que não recebe 200. Repetir
        // não é erro: é o comportamento normal, e a resposta tem que ser
        // 200 pra ele parar de tentar.
        return { resultado: "JA_PROCESSADO" };
      }

      throw erro;
    }

    const desfecho = await this.aplicar(evento);

    await prisma.eventoWebhookPagamento.update({
      where: { id: registro.id },
      data: { processadoEm: new Date(), resultado: desfecho.resultado, erro: desfecho.detalhe ?? null },
    });

    return desfecho;
  }

  private async aplicar(evento: WebhookEvento): Promise<{
    resultado: ResultadoWebhook;
    detalhe?: string;
  }> {
    const prisma = prismaDaRequisicao();
    if (evento.situacao !== "PAGO") {
      // Pendente e recusado não mudam nada: a mensalidade continua em
      // aberto e o aluno pode tentar de novo.
      return { resultado: "IGNORADO", detalhe: `Situação ${evento.situacao ?? "desconhecida"}.` };
    }

    const mensalidadeId = Number(evento.referenciaExterna);

    if (!Number.isInteger(mensalidadeId) || mensalidadeId <= 0) {
      return { resultado: "IGNORADO", detalhe: "Notificação sem referência a uma mensalidade." };
    }

    const mensalidade = await prisma.mensalidade.findUnique({ where: { id: mensalidadeId } });

    if (!mensalidade) {
      return { resultado: "MENSALIDADE_NAO_ENCONTRADA" };
    }

    if (mensalidade.status === "PAGA") {
      return { resultado: "JA_PROCESSADO" };
    }

    if (mensalidade.status === "CANCELADA" || mensalidade.status === "ESTORNADA") {
      // Pagamento que cai depois do cancelamento não deve reabrir a
      // cobrança sozinho — é caso pra alguém olhar e devolver.
      return {
        resultado: "IGNORADO",
        detalhe: `Mensalidade ${mensalidade.status.toLowerCase()}; pagamento precisa de tratamento manual.`,
      };
    }

    const atualizada = await prisma.mensalidade.update({
      where: { id: mensalidadeId },
      data: {
        status: "PAGA",
        dataPagamento: new Date(),
        // valorFinal é o que o aluno de fato pagou no gateway.
        valorFinal: evento.valorPago ?? mensalidade.valorFinal,
      },
    });

    // Webhook não tem sessão: a auditoria registra a origem no lugar do
    // autor. É a operação mais silenciosa do sistema — dinheiro entrando
    // sem ninguém clicar — então é a que mais precisa de rastro.
    await auditLogService.registrar({
      unidadeId: atualizada.unidadeId,
      origemSistema: `webhook:${this.nomeGateway}`,
      entidade: "Mensalidade",
      entidadeId: atualizada.id,
      operacao: "PAGAMENTO",
      valoresAntes: { status: mensalidade.status },
      valoresDepois: { status: "PAGA", origem: "webhook", recursoId: evento.recursoId },
    });

    return { resultado: "PAGAMENTO_REGISTRADO" };
  }
}
