import { Request, Response } from "express";

import { CreateModeloContratoService } from "./services/CreateModeloContratoService";
import { UpdateModeloContratoService } from "./services/UpdateModeloContratoService";
import { ListModelosContratoService } from "./services/ListModelosContratoService";
import { ToggleAtivoModeloContratoService } from "./services/ToggleAtivoModeloContratoService";
import { VersionarModeloContratoService } from "./services/VersionarModeloContratoService";
import { ClonarModeloContratoService } from "./services/ClonarModeloContratoService";
import { requireUnidadeId } from "../../shared/utils/requireUnidadeId";

export class ModelosContratoController {
  async create(req: Request, res: Response) {
    const service = new CreateModeloContratoService();

    const modelo = await service.execute({ ...req.body, unidadeId: requireUnidadeId(req) });

    return res.status(201).json(modelo);
  }

  async update(req: Request, res: Response) {
    const { id } = req.params;

    const service = new UpdateModeloContratoService();

    const modelo = await service.execute(Number(id), req.user.unidadeId, req.body);

    return res.json(modelo);
  }

  async list(req: Request, res: Response) {
    const service = new ListModelosContratoService();

    const modelos = await service.execute(req.user.unidadeId);

    return res.json(modelos);
  }

  async toggleAtivo(req: Request, res: Response) {
    const { id } = req.params;

    const service = new ToggleAtivoModeloContratoService();

    const modelo = await service.execute(Number(id), req.user.unidadeId);

    return res.json(modelo);
  }

  async versionar(req: Request, res: Response) {
    const { id } = req.params;

    const service = new VersionarModeloContratoService();

    const modelo = await service.execute(Number(id), req.user.unidadeId);

    return res.status(201).json(modelo);
  }

  async clonar(req: Request, res: Response) {
    const { id } = req.params;

    const service = new ClonarModeloContratoService();

    const modelo = await service.execute(Number(id), req.user.unidadeId);

    return res.status(201).json(modelo);
  }
}
