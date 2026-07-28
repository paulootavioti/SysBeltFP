import { Request, Response } from "express";

import { CreateUnidadeService } from "./services/CreateUnidadeService";
import { UpdateUnidadeService } from "./services/UpdateUnidadeService";
import { ListUnidadesService } from "./services/ListUnidadesService";
import { ListUnidadesOpcoesService } from "./services/ListUnidadesOpcoesService";
import { ToggleAtivoUnidadeService } from "./services/ToggleAtivoUnidadeService";

export class UnidadesController {

  async create(req: Request, res: Response) {
    const service = new CreateUnidadeService();

    const unidade = await service.execute(req.body);

    return res.status(201).json(unidade);
  }

  async update(req: Request, res: Response) {
    const { id } = req.params;

    const service = new UpdateUnidadeService();

    const unidade = await service.execute(Number(id), req.body);

    return res.json(unidade);
  }

  async list(req: Request, res: Response) {
    const service = new ListUnidadesService();

    const unidades = await service.execute();

    return res.json(unidades);
  }

  async listarOpcoes(req: Request, res: Response) {
    const service = new ListUnidadesOpcoesService();

    const unidades = await service.execute();

    return res.json(unidades);
  }

  async toggleAtivo(req: Request, res: Response) {
    const { id } = req.params;

    const service = new ToggleAtivoUnidadeService();

    const unidade = await service.execute(Number(id));

    return res.json(unidade);
  }

}
