import { Request, Response } from "express";
import { ListAvisosService } from "./services/ListAvisosService";
import { ReconhecerAvisosService } from "./services/ReconhecerAvisosService";

export class AvisosController {

  async list(req: Request, res: Response) {
    const service = new ListAvisosService();

    const avisos = await service.execute(req.user.id);

    return res.json({
      total: avisos.length,
      avisos,
    });
  }

  async reconhecer(req: Request, res: Response) {
    const service = new ReconhecerAvisosService();

    await service.execute(req.user.id, req.body.avisos);

    return res.status(204).send();
  }
}
