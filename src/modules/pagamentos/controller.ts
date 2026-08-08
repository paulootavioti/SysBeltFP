import { Request, Response } from "express";

import { AppError } from "../../shared/errors/AppError";
import { MercadoPagoGateway } from "./gateways/MercadoPagoGateway";
import { verificarAssinaturaMercadoPago } from "./gateways/mercadoPago/assinaturaWebhook";
import { segredoWebhookMercadoPago } from "./gateways/mercadoPago/clienteMercadoPago";
import { ReceberWebhookPagamentoService } from "./services/ReceberWebhookPagamentoService";

function cabecalho(req: Request, nome: string): string | undefined {
  const valor = req.headers[nome];

  return Array.isArray(valor) ? valor[0] : valor;
}

export class PagamentosController {
  // Webhook não carrega o JWT da aplicação: a autenticação é a assinatura
  // do próprio gateway. Sem essa verificação, qualquer um que descubra a
  // URL daria baixa numa mensalidade sem pagar.
  async webhook(req: Request, res: Response) {
    const nomeGateway = String(req.params.gateway).toUpperCase();

    if (nomeGateway !== "MERCADO_PAGO") {
      throw new AppError(`Webhook do gateway "${req.params.gateway}" não está integrado.`, 501);
    }

    // O `data.id` chega na query string nas notificações do Mercado Pago;
    // no corpo em algumas versões. O manifesto assinado usa o da query.
    const recursoId =
      (req.query["data.id"] as string | undefined) ??
      (req.body?.data?.id !== undefined ? String(req.body.data.id) : undefined);

    const verificacao = verificarAssinaturaMercadoPago({
      assinatura: cabecalho(req, "x-signature"),
      requestId: cabecalho(req, "x-request-id"),
      recursoId,
      segredo: segredoWebhookMercadoPago(),
    });

    if (!verificacao.valida) {
      // 401 sem detalhe: dizer exatamente o que falhou ajudaria quem está
      // tentando forjar. O motivo fica no log do servidor.
      console.warn("Webhook Mercado Pago recusado:", verificacao.motivo);

      return res.status(401).json({ erro: "Assinatura inválida." });
    }

    const service = new ReceberWebhookPagamentoService();

    const desfecho = await service.execute({
      gateway: new MercadoPagoGateway(),
      nomeGateway,
      payload: req.body,
    });

    // Sempre 200 quando a assinatura confere, mesmo se o evento não se
    // aplica: 4xx/5xx faria o Mercado Pago reenviar em loop algo que
    // nunca vai ser aceito.
    return res.status(200).json(desfecho);
  }
}
