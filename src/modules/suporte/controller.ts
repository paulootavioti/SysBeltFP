import type { Request, Response } from "express";

import { CriarSolicitacaoSuporteService } from "./services/CriarSolicitacaoSuporteService";

export class SuporteController {
  async criar(req: Request, res: Response) {
    const solicitacao = await new CriarSolicitacaoSuporteService().execute({
      usuario: req.user,
      mensagem: req.body.mensagem,
      contexto: req.body.contexto,
    });
    return res.status(201).json({ id: solicitacao.id, status: solicitacao.status });
  }
}
