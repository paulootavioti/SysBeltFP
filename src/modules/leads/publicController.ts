import type { Request, Response } from "express";
import { GetCaptacaoPublicaService } from "./services/GetCaptacaoPublicaService";
import { CriarLeadPublicoV2Service } from "./services/CriarLeadPublicoV2Service";

export class CaptacaoPublicaController {
  async obter(req: Request, res: Response) {
    return res.json(await new GetCaptacaoPublicaService().execute(String(req.params.slug)));
  }

  async criar(req: Request, res: Response) {
    await new CriarLeadPublicoV2Service().execute(String(req.params.slug), req.body);
    return res.status(202).json({ message: "Recebemos seus dados. Nossa equipe entrará em contato em breve." });
  }
}
