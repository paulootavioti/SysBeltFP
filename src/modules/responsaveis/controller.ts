import { Request, Response } from "express";

import { CreateResponsavelService } from "./services/CreateResponsavelService";
import { ListResponsaveisService } from "./services/ListResponsaveisService";
import { GetResponsavelService } from "./services/GetResponsavelService";
import { UpdateResponsavelService } from "./services/UpdateResponsavelService";
import { ToggleResponsavelAtivoService } from "./services/ToggleResponsavelAtivoService";
import { DeleteResponsavelService } from "./services/DeleteResponsavelService";

import { ListResponsaveisByAlunoService } from "./services/ListResponsaveisByAlunoService";

export class ResponsaveisController {

  async create(req: Request, res: Response) {
    const service = new CreateResponsavelService();

    const responsavel = await service.execute(req.body, req.user.unidadeId);

    return res.status(201).json(responsavel);
  }

  async list(req: Request, res: Response) {
    const service = new ListResponsaveisService();

    const responsaveis = await service.execute(req.user.unidadeId);

    return res.json(responsaveis);
  }

  async show(req: Request, res: Response) {
    const { id } = req.params;

    const service = new GetResponsavelService();

    const responsavel = await service.execute(Number(id), req.user.unidadeId);

    return res.json(responsavel);
  }

  async update(req: Request, res: Response) {
    const { id } = req.params;

    const service = new UpdateResponsavelService();

    const responsavel = await service.execute(
      {
        id: Number(id),
        ...req.body,
      },
      req.user.unidadeId
    );

    return res.json(responsavel);
  }

  async toggleAtivo(req: Request, res: Response) {
    const { id } = req.params;

    const service = new ToggleResponsavelAtivoService();

    const responsavel = await service.execute(Number(id), req.user.unidadeId);

    return res.json(responsavel);
  }

  async delete(req: Request, res: Response) {
    const { id } = req.params;

    const service = new DeleteResponsavelService();

    await service.execute(Number(id), req.user.unidadeId);

    return res.status(204).send();
  }

  async listByAluno(req: Request, res: Response) {
    const { alunoId } = req.params;

    const service = new ListResponsaveisByAlunoService();

    const responsaveis = await service.execute(Number(alunoId), req.user.unidadeId);

    return res.json(responsaveis);
  }
}
