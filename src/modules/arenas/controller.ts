import { Request, Response } from "express";

import { CreateArenaService } from "./services/CreateArenaService";
import { UpdateArenaService } from "./services/UpdateArenaService";
import { ListArenasService } from "./services/ListArenasService";
import { ToggleAtivoArenaService } from "./services/ToggleAtivoArenaService";
import { AppError } from "../../shared/errors/AppError";

export class ArenasController {

  async create(req: Request, res: Response) {
    // um ADMIN sempre cadastra dentro da própria unidade; só um SUPERADMIN
    // (sem unidade fixa) pode e precisa informar em qual unidade a arena entra.
    const unidadeId = req.user.unidadeId ?? req.body.unidadeId ?? null;

    if (!unidadeId) {
      throw new AppError("Informe a unidade para esta arena.");
    }

    const service = new CreateArenaService();

    const arena = await service.execute({ ...req.body, unidadeId });

    return res.status(201).json(arena);
  }

  async update(req: Request, res: Response) {
    const { id } = req.params;

    const service = new UpdateArenaService();

    const arena = await service.execute(Number(id), req.body, req.user.unidadeId);

    return res.json(arena);
  }

  async list(req: Request, res: Response) {
    const service = new ListArenasService();

    const arenas = await service.execute(req.user.unidadeId);

    return res.json(arenas);
  }

  async toggleAtivo(req: Request, res: Response) {
    const { id } = req.params;

    const service = new ToggleAtivoArenaService();

    const arena = await service.execute(Number(id), req.user.unidadeId);

    return res.json(arena);
  }

}
