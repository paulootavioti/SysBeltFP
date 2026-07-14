import { Request, Response } from "express";

import { StartAulaService } from "./services/StartAulaService";
import { ListAulasService } from "./services/ListAulasService";
import { GetAulaService } from "./services/GetAulaService";
import { FinalizarAulaService } from "./services/FinalizarAulaService";
import { UpdateAulaAlunoService } from "./services/UpdateAulaAlunoService";

import { CreateAulaProgramadaService } from "./services/CreateAulaProgramadaService";
import { ListAulasProgramadasService } from "./services/ListAulasProgramadasService";
import { IniciarAulaProgramadaService } from "./services/IniciarAulaProgramadaService";
import { DeleteAulaService } from "./services/DeleteAulaService";
import { DeleteAulaProgramadaService } from "./services/DeleteAulaProgramadaService";

export class AulasController {
  async create(req: Request, res: Response) {
    const service = new StartAulaService();

    const aula = await service.execute(req.body);

    return res.status(201).json(aula);
  }

  async list(req: Request, res: Response) {
    const service = new ListAulasService();

    const aulas = await service.execute();

    return res.json(aulas);
  }

  async show(req: Request, res: Response) {
    const service = new GetAulaService();

    const aula = await service.execute(Number(req.params.id));

    return res.json(aula);
  }

  async finalizar(req: Request, res: Response) {
    const service = new FinalizarAulaService();
  
    const aula = await service.execute(
      Number(req.params.id)
    );
  
    return res.json(aula);
  }

  async updateAluno(req: Request, res: Response) {
    const service = new UpdateAulaAlunoService();
  
    const registro = await service.execute({
      id: Number(req.params.id),
      ...req.body,
    });
  
    return res.json(registro);
  }

  async criarProgramada(req: Request, res: Response) {
    const service = new CreateAulaProgramadaService();

    const programacao = await service.execute(req.body);

    return res.status(201).json(programacao);
  }

  async listarProgramadas(req: Request, res: Response) {
    const service = new ListAulasProgramadasService();

    const programacoes = await service.execute();

    return res.json(programacoes);
  }

  async iniciarProgramada(req: Request, res: Response) {
    const service = new IniciarAulaProgramadaService();

    const aula = await service.execute(Number(req.params.id));

    return res.json(aula);
  }

  async delete(req: Request, res: Response) {
    const service = new DeleteAulaService();

    await service.execute(Number(req.params.id));

    return res.status(204).send();
  }

  async deleteProgramada(req: Request, res: Response) {
    const service = new DeleteAulaProgramadaService();

    await service.execute(Number(req.params.id));

    return res.status(204).send();
  }
}