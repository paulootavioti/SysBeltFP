import { Request, Response } from "express";

import { CreateAlunoService } from "./services/CreateAlunoService";

import { ListAlunosService } from "./services/ListAlunosService";

import { ListAniversariantesService } from "./services/ListAniversariantesService";

import { GetProntuarioAlunoService } from "./services/GetProntuarioAlunoService";

import { UpdateAlunoService } from "./services/UpdateAlunoService";

import { ToggleAlunoAtivoService } from "./services/ToggleAlunoAtivoService";

import { GetAlunoCompletoService } from "./services/GetAlunoCompletoService";
import { requireUnidadeId } from "../../shared/utils/requireUnidadeId";


export class AlunosController {
  async create(req: Request, res: Response) {
    const service = new CreateAlunoService();

    const aluno = await service.execute({ ...req.body, unidadeId: requireUnidadeId(req) });

    return res.status(201).json(aluno);
  }

  async list(req: Request, res: Response) {
    const service = new ListAlunosService();

    const alunos = await service.execute(req.user.unidadeId, req.user.perfil);

    return res.json(alunos);
  }

  //Aniverriantes
  async aniversariantes(req: Request, res: Response) {
    const service = new ListAniversariantesService();

    const alunos = await service.execute(req.user.unidadeId);

    return res.json(alunos);
  }

  async prontuario(req: Request, res: Response) {
    const { id } = req.params;

    const service = new GetProntuarioAlunoService();

    const prontuario = await service.execute(Number(id), req.user.unidadeId);

    return res.json(prontuario);
  }

  async update(req: Request, res: Response) {
    const { id } = req.params;

    const service = new UpdateAlunoService();

    const aluno = await service.execute(
      {
        id: Number(id),
        ...req.body,
      },
      req.user.unidadeId
    );

    return res.json(aluno);
  }

  async toggleAtivo(req: Request, res: Response) {
    const { id } = req.params;

    const service = new ToggleAlunoAtivoService();

    const aluno = await service.execute(Number(id), req.user.unidadeId);

    return res.json(aluno);
  }

  async show(req: Request, res: Response) {
    const { id } = req.params;

    const service = new GetAlunoCompletoService();

    const aluno = await service.execute(Number(id), req.user.unidadeId, req.user.perfil);

    return res.json(aluno);
  }
}
