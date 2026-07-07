import { Request, Response } from "express";

import { CreateCurriculoService } from "./services/CreateCurriculoService";
import { ListCurriculosService } from "./services/ListCurriculosService";
import { GetCurriculoService } from "./services/GetCurriculoService";
import { CreateModuloCurriculoService } from "./services/CreateModuloCurriculoService";
import { CreateAulaCurriculoService } from "./services/CreateAulaCurriculoService";
import { CreateTecnicaCurriculoService } from "./services/CreateTecnicaCurriculoService";

export class CurriculosController {
  async create(req: Request, res: Response) {
    const service = new CreateCurriculoService();

    const curriculo = await service.execute(req.body);

    return res.status(201).json(curriculo);
  }

  async list(req: Request, res: Response) {
    const service = new ListCurriculosService();

    const curriculos = await service.execute();

    return res.json(curriculos);
  }

  async show(req: Request, res: Response) {
    const service = new GetCurriculoService();

    const curriculo = await service.execute(Number(req.params.id));

    return res.json(curriculo);
  }

  async createModulo(req: Request, res: Response) {
    const service = new CreateModuloCurriculoService();

    const modulo = await service.execute(req.body);

    return res.status(201).json(modulo);
  }

  async createAula(req: Request, res: Response) {
    const service = new CreateAulaCurriculoService();

    const aula = await service.execute(req.body);

    return res.status(201).json(aula);
  }

  async createTecnica(req: Request, res: Response) {
    const service = new CreateTecnicaCurriculoService();

    const tecnica = await service.execute(req.body);

    return res.status(201).json(tecnica);
  }
}