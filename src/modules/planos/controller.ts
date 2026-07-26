import { Request, Response } from "express";

import { CreatePlanoService } from "./services/CreatePlanoService";
import { UpdatePlanoService } from "./services/UpdatePlanoService";
import { ListPlanosService } from "./services/ListPlanosService";
import { ToggleAtivoPlanoService } from "./services/ToggleAtivoPlanoService";
import { requireUnidadeId } from "../../shared/utils/requireUnidadeId";

export class PlanosController {

  async create(req: Request, res: Response) {
    const service = new CreatePlanoService();

    const plano = await service.execute({ ...req.body, unidadeId: requireUnidadeId(req) });

    return res.status(201).json(plano);
  }

  async update(req: Request, res: Response) {
    const { id } = req.params;

    const service = new UpdatePlanoService();

    const plano = await service.execute(Number(id), req.body);

    return res.json(plano);
  }

  async list(req: Request, res: Response) {
    const service = new ListPlanosService();

    const planos = await service.execute();

    return res.json(planos);
  }

  async toggleAtivo(req: Request, res: Response) {
    const { id } = req.params;

    const service = new ToggleAtivoPlanoService();

    const plano = await service.execute(Number(id));

    return res.json(plano);
  }

}
