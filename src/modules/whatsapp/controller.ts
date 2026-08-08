import { Request, Response } from "express";

import { obterProvedorMensagens } from "./providers";
import { verificarAssinaturaMeta } from "./providers/assinaturaMeta";
import { segredoAplicativoMeta, tokenVerificacaoWebhook } from "./providers/MetaCloudApiProvider";
import { AtualizarEntregaService } from "./services/AtualizarEntregaService";

export class WhatsappController {
  // A Meta faz um GET com hub.challenge pra confirmar que a URL é nossa
  // antes de começar a mandar eventos. Responder o desafio em texto puro
  // é o que "assina" o cadastro do webhook.
  async verificar(req: Request, res: Response) {
    const modo = req.query["hub.mode"];
    const token = req.query["hub.verify_token"];
    const desafio = req.query["hub.challenge"];

    const esperado = tokenVerificacaoWebhook();

    if (modo === "subscribe" && esperado && token === esperado) {
      return res.status(200).send(String(desafio ?? ""));
    }

    return res.sendStatus(403);
  }

  async receber(req: Request, res: Response) {
    const verificacao = verificarAssinaturaMeta(
      req.corpoCru,
      req.headers["x-hub-signature-256"] as string | undefined,
      segredoAplicativoMeta()
    );

    if (!verificacao.valida) {
      console.warn("Webhook WhatsApp recusado:", verificacao.motivo);

      return res.sendStatus(401);
    }

    const atualizacoes = obterProvedorMensagens().interpretarWebhook(req.body);

    const service = new AtualizarEntregaService();

    const resultado = await service.execute(atualizacoes);

    // Sempre 200 quando a assinatura confere: a Meta reenvia diante de
    // erro, e reenviar um evento que já não se aplica não ajuda ninguém.
    return res.status(200).json(resultado);
  }
}
