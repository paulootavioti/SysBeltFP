import { Request, Response } from "express";

import { CreateSalaService } from "./services/CreateSalaService";
import { UpdateSalaService } from "./services/UpdateSalaService";
import { ListSalasService } from "./services/ListSalasService";
import { ToggleAtivoSalaService } from "./services/ToggleAtivoSalaService";
import { requireUnidadeId } from "../../shared/utils/requireUnidadeId";

export class SalasController {

  async create(req: Request, res: Response) {
    const service = new CreateSalaService();

    const sala = await service.execute({ ...req.body, unidadeId: requireUnidadeId(req) });

    return res.status(201).json(sala);
  }

  async update(req: Request, res: Response) {
    const { id } = req.params;

    const service = new UpdateSalaService();

    const sala = await service.execute(Number(id), req.body, req.user.unidadeId);

    return res.json(sala);
  }

  async list(req: Request, res: Response) {
    const service = new ListSalasService();

    const salas = await service.execute(req.user.unidadeId);

    return res.json(salas);
  }

  async toggleAtivo(req: Request, res: Response) {
    const { id } = req.params;

    const service = new ToggleAtivoSalaService();

    const sala = await service.execute(Number(id), req.user.unidadeId);

    return res.json(sala);
  }

}
