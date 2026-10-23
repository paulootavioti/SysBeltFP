import { Prisma } from "@prisma/client";

import { prismaDaRequisicao } from "../../../shared/database/prismaDaRequisicao";
import { logger } from "../../../shared/observability/logger";
import { AuditLogService } from "../../../shared/services/AuditLogService";
import type { PaymentGateway, WebhookEvento } from "../gateways/PaymentGateway";

const auditLogService = new AuditLogService();

export type ResultadoWebhook =
  | "PAGAMENTO_REGISTRADO"
  | "JA_PROCESSADO"
  | "IGNORADO"
  | "MENSALIDADE_NAO_ENCONTRADA"
  | "PEDIDO_NAO_ENCONTRADO"
  | "PEDIDO_LIBERADO";

interface ReceberWebhookDTO {
  gateway: PaymentGateway;
  nomeGateway: string;
  payload: unknown;
  // Conta (assinante) dona das credenciais que autenticaram a notificação.
  // Ausente só na instalação legada de uma academia, com credenciais em
  // variável de ambiente.
  contaId?: number | null;
}

export class ReceberWebhookPagamentoService {
  private nomeGateway = "";
  private contaId: number | null = null;

  async execute({ gateway, nomeGateway, payload, contaId }: ReceberWebhookDTO): Promise<{
    resultado: ResultadoWebhook;
    detalhe?: string;
  }> {
    const prisma = prismaDaRequisicao();
    this.nomeGateway = nomeGateway;
    this.contaId = contaId ?? null;

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

    if (evento.recursoId) {
      await prisma.cobrancaPagamento.updateMany({
        where: { gateway: nomeGateway, gatewayId: evento.recursoId },
        data: {
          status: evento.situacao ?? "DESCONHECIDO",
          consultadoEm: new Date(),
          reconciliadoEm: evento.situacao === "PAGO" ? new Date() : null,
          erro: desfecho.resultado === "IGNORADO" ? desfecho.detalhe : null,
        },
      });
    }

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

    if (evento.recorrente || evento.referenciaExterna?.startsWith("assinatura:")) {
      // A referência de uma assinatura é o id DELA: lida como mensalidade,
      // daria baixa na mensalidade de mesmo número — de outro aluno.
      return { resultado: "IGNORADO", detalhe: "Pagamento recorrente de assinatura; baixa não é automática." };
    }

    if (evento.referenciaExterna?.startsWith("pedido:")) {
      const pedidoId = Number(evento.referenciaExterna.slice("pedido:".length));
      if (!Number.isInteger(pedidoId) || pedidoId <= 0) return { resultado: "IGNORADO", detalhe: "Referência de pedido inválida." };
      const pedido = await prisma.pedido.findUnique({ where: { id: pedidoId }, include: { unidade: { select: { contaId: true } } } });
      if (!pedido) return { resultado: "PEDIDO_NAO_ENCONTRADO" };
      if (this.deOutraConta(pedido.unidade.contaId, "Pedido", pedido.id)) {
        return { resultado: "IGNORADO", detalhe: "Referência de outra conta." };
      }
      if (["AGUARDANDO_RETIRADA", "ENTREGUE"].includes(pedido.status)) return { resultado: "JA_PROCESSADO" };
      if (pedido.status === "CANCELADO") return { resultado: "IGNORADO", detalhe: "Pedido cancelado; pagamento precisa de tratamento manual." };
      await prisma.pedido.update({ where: { id: pedido.id }, data: { status: "AGUARDANDO_RETIRADA", pagoEm: new Date() } });
      await auditLogService.registrar({
        unidadeId: pedido.unidadeId, origemSistema: `webhook:${this.nomeGateway}`, entidade: "Pedido", entidadeId: pedido.id,
        operacao: "PAGAMENTO", valoresAntes: { status: pedido.status }, valoresDepois: { status: "AGUARDANDO_RETIRADA", recursoId: evento.recursoId },
      });
      return { resultado: "PEDIDO_LIBERADO" };
    }

    const mensalidadeId = Number(evento.referenciaExterna);

    if (!Number.isInteger(mensalidadeId) || mensalidadeId <= 0) {
      return { resultado: "IGNORADO", detalhe: "Notificação sem referência a uma mensalidade." };
    }

    const mensalidade = await prisma.mensalidade.findUnique({
      where: { id: mensalidadeId },
      include: { unidade: { select: { contaId: true } } },
    });

    if (!mensalidade) {
      return { resultado: "MENSALIDADE_NAO_ENCONTRADA" };
    }

    if (this.deOutraConta(mensalidade.unidade.contaId, "Mensalidade", mensalidade.id)) {
      return { resultado: "IGNORADO", detalhe: "Referência de outra conta." };
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

  // A assinatura prova só que a notificação veio da conta do Mercado Pago
  // de uma academia; a referência dentro do pagamento é texto que essa
  // academia escolheu. Sem esta trava, um assinante daria baixa na
  // mensalidade de outro criando, na própria conta, um pagamento com o
  // id dela como referência.
  private deOutraConta(contaDoRecurso: number, entidade: string, id: number): boolean {
    if (this.contaId === null || contaDoRecurso === this.contaId) return false;
    logger.warn("webhook_pagamento_conta_divergente", {
      gateway: this.nomeGateway,
      entidade,
      entidadeId: id,
      contaDaCredencial: this.contaId,
      contaDoRecurso,
    });
    return true;
  }
}
