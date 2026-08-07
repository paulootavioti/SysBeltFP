import { Request, Response } from "express";

import { CreateModalidadeService } from "./services/CreateModalidadeService";
import { UpdateModalidadeService } from "./services/UpdateModalidadeService";
import { ListModalidadesService } from "./services/ListModalidadesService";
import { ToggleAtivoModalidadeService } from "./services/ToggleAtivoModalidadeService";
import { AppError } from "../../shared/errors/AppError";

export class ModalidadesController {
  async create(req: Request, res: Response) {
    // um ADMIN sempre cadastra dentro da própria unidade; só um SUPERADMIN
    // (sem unidade fixa) precisa informar em qual unidade a modalidade entra.
    const unidadeId = req.user.unidadeId ?? req.body.unidadeId ?? null;

    if (!unidadeId) {
      throw new AppError("Informe a unidade para esta modalidade.");
    }

    const service = new CreateModalidadeService();

    const modalidade = await service.execute({ ...req.body, unidadeId });

    return res.status(201).json(modalidade);
  }

  async list(req: Request, res: Response) {
    const service = new ListModalidadesService();

    const modalidades = await service.execute(req.user.unidadeId, {
      apenasAtivas: req.query.ativas === "true",
    });

    return res.json(modalidades);
  }

  async update(req: Request, res: Response) {
    const service = new UpdateModalidadeService();

    const modalidade = await service.execute(
      Number(req.params.id),
      req.body,
      req.user.unidadeId
    );

    return res.json(modalidade);
  }

  async toggleAtivo(req: Request, res: Response) {
    const service = new ToggleAtivoModalidadeService();

    const modalidade = await service.execute(Number(req.params.id), req.user.unidadeId);

    return res.json(modalidade);
  }
}
