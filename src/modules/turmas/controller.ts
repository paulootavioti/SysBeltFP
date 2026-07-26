import { Request, Response } from "express";

import { CreateTurmaService } from "./services/CreateTurmaService";
import { UpdateTurmaService } from "./services/UpdateTurmaService";
import { ListTurmasService } from "./services/ListTurmasService";
import { VincularAlunoTurmaService } from "./services/VincularAlunoTurmaService";
import { GetTurmaDetalhadaService } from "./services/GetTurmaDetalhadaService";

import { ToggleTurmaAtivoService } from "./services/ToggleTurmaAtivoService";
import { requireUnidadeId } from "../../shared/utils/requireUnidadeId";

export class TurmasController {

  async create(
    req: Request,
    res: Response
  ) {

    const service =
      new CreateTurmaService();

    const turma =
      await service.execute({ ...req.body, unidadeId: requireUnidadeId(req) });

    return res.status(201).json(turma);

  }

  async update(
    req: Request,
    res: Response
  ) {

    const { id } =
      req.params;

    const service =
      new UpdateTurmaService();

    const turma =
      await service.execute(
        Number(id),
        req.body
      );

    return res.json(turma);

  }

  async list(
    req: Request,
    res: Response
  ) {

    const service =
      new ListTurmasService();

    const turmas =
      await service.execute();

    return res.json(turmas);

  }

  async show(
    req: Request,
    res: Response
  ) {

    const { id } =
      req.params;

    const service =
      new GetTurmaDetalhadaService();

    const turma =
      await service.execute(
        Number(id)
      );

    return res.json(turma);

  }

  async vincularAluno(
    req: Request,
    res: Response
  ) {

    const { turmaId, alunoId } =
      req.params;

    const service =
      new VincularAlunoTurmaService();

    const aluno =
      await service.execute(
        Number(turmaId),
        Number(alunoId)
      );

    return res.json(aluno);

  }

  async toggleAtivo(req: Request, res: Response) {
    const { id } = req.params;

    const service = new ToggleTurmaAtivoService();

    const turma = await service.execute(Number(id));

    return res.json(turma);
  }

}