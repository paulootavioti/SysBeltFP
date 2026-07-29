import { Request, Response } from "express";

// Endpoint de recebimento de webhooks de provedor de assinatura eletrônica
// — estrutura pra fase futura de integração real. Até lá, nenhum provedor
// está configurado (ver src/modules/assinaturaEletronica/providers), então
// qualquer chamada aqui só pode vir de uma integração ainda não habilitada.
export class AssinaturaEletronicaController {
  async webhook(req: Request, res: Response) {
    return res.status(501).json({
      erro: `Webhook do provedor "${req.params.provedor}" ainda não está integrado.`,
    });
  }
}
