import { Request, Response } from "express";

import { GetContadoresMenuService } from "./services/GetContadoresMenuService";

const getContadoresMenuService = new GetContadoresMenuService();

export class NotificacoesController {
  async contadoresMenu(req: Request, res: Response) {
    const contadores = await getContadoresMenuService.execute(req.user.unidadeId);

    return res.json(contadores);
  }
}
