import { Request, Response } from "express";

import { prismaDaRequisicao } from "../../shared/database/prismaDaRequisicao";
import { AppError } from "../../shared/errors/AppError";
import { MercadoPagoGateway } from "./gateways/MercadoPagoGateway";
import { verificarAssinaturaMercadoPago } from "./gateways/mercadoPago/assinaturaWebhook";
import { lerCredenciaisGateway, type CredenciaisGateway } from "./gateways/credenciais";
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

    // Qual assinante é este? Com vários clientes no mesmo servidor, cada
    // um tem o próprio segredo de webhook, e a assinatura precisa ser
    // conferida ANTES de confiar em qualquer coisa do corpo — então o
    // dono não pode vir do payload. Vem da URL, que a academia informa ao
    // configurar a notificação no painel do Mercado Pago.
    //
    // O id na URL não é segredo, e não precisa ser: quem não tiver o
    // segredo daquela unidade não consegue forjar a assinatura.
    const credenciais = await resolverCredenciais(
      req.params.formaPagamentoId as string | undefined
    );

    if (!credenciais) {
      return res.status(404).json({ erro: "Forma de pagamento não encontrada." });
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
      segredo: credenciais.webhookSecret,
    });

    if (!verificacao.valida) {
      // 401 sem detalhe: dizer exatamente o que falhou ajudaria quem está
      // tentando forjar. O motivo fica no log do servidor.
      console.warn("Webhook Mercado Pago recusado:", verificacao.motivo);

      return res.status(401).json({ erro: "Assinatura inválida." });
    }

    const service = new ReceberWebhookPagamentoService();

    const desfecho = await service.execute({
      // O mesmo par de credenciais que autenticou a notificação é o que
      // relê o pagamento na API — a consulta tem que ser feita na conta
      // de quem recebeu o dinheiro.
      gateway: new MercadoPagoGateway(credenciais),
      nomeGateway,
      payload: req.body,
    });

    // Sempre 200 quando a assinatura confere, mesmo se o evento não se
    // aplica: 4xx/5xx faria o Mercado Pago reenviar em loop algo que
    // nunca vai ser aceito.
    return res.status(200).json(desfecho);
  }
}

async function resolverCredenciais(
  formaPagamentoId: string | undefined
): Promise<CredenciaisGateway | null> {
  const prisma = prismaDaRequisicao();
  // Sem id na URL: instalação de uma academia só, ainda usando as
  // variáveis de ambiente. `lerCredenciaisGateway` cai nelas e avisa.
  if (!formaPagamentoId) {
    return lerCredenciaisGateway(null);
  }

  const id = Number(formaPagamentoId);

  if (!Number.isInteger(id) || id <= 0) return null;

  const forma = await prisma.formaPagamento.findUnique({
    where: { id },
    select: { configuracao: true },
  });

  if (!forma) return null;

  return lerCredenciaisGateway(forma.configuracao);
}
