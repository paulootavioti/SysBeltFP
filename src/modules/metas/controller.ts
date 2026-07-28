import { Request, Response } from "express";

import { CreateMetaService } from "./services/CreateMetaService";
import { UpdateMetaService } from "./services/UpdateMetaService";
import { DeleteMetaService } from "./services/DeleteMetaService";
import { ListMetasService } from "./services/ListMetasService";
import { requireUnidadeId } from "../../shared/utils/requireUnidadeId";

export class MetasController {
  async list(req: Request, res: Response) {
    const service = new ListMetasService();
    const metas = await service.execute(req.user.unidadeId);
    return res.json(metas);
  }

  async create(req: Request, res: Response) {
    const { nome, tipo, valorMeta, formatoValor, dataLimite } = req.body;

    const service = new CreateMetaService();
    const meta = await service.execute({
      unidadeId: requireUnidadeId(req),
      nome,
      tipo,
      valorMeta: Number(valorMeta),
      formatoValor,
      dataLimite,
    });

    return res.status(201).json(meta);
  }

  async update(req: Request, res: Response) {
    const { id } = req.params;
    const { nome, tipo, valorMeta, formatoValor, dataLimite } = req.body;

    const service = new UpdateMetaService();
    const meta = await service.execute({
      id: Number(id),
      unidadeIdUsuario: req.user.unidadeId,
      nome,
      tipo,
      valorMeta: Number(valorMeta),
      formatoValor,
      dataLimite,
    });

    return res.json(meta);
  }

  async delete(req: Request, res: Response) {
    const { id } = req.params;

    const service = new DeleteMetaService();
    await service.execute(Number(id), req.user.unidadeId);

    return res.status(204).send();
  }
}
