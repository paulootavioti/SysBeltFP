import { Request, Response } from "express";

// Endpoint de recebimento de webhooks de gateway — estrutura pra fase
// futura de integração real. Até lá, nenhum gateway está configurado
// (ver src/modules/pagamentos/gateways), então qualquer chamada aqui só
// pode vir de uma integração ainda não habilitada.
export class PagamentosController {
  async webhook(req: Request, res: Response) {
    return res.status(501).json({
      erro: `Webhook do gateway "${req.params.gateway}" ainda não está integrado.`,
    });
  }
}
