import { Request, Response } from "express";

import { CreateAlunoService } from "./services/CreateAlunoService";

import { ListAlunosService } from "./services/ListAlunosService";

import { ListAniversariantesService } from "./services/ListAniversariantesService";

import { GetProntuarioAlunoService } from "./services/GetProntuarioAlunoService";

import { UpdateAlunoService } from "./services/UpdateAlunoService";

import { ToggleAlunoAtivoService } from "./services/ToggleAlunoAtivoService";

import { GetAlunoCompletoService } from "./services/GetAlunoCompletoService";
import { SetSenhaPortalAlunoService } from "./services/SetSenhaPortalAlunoService";
import { requireUnidadeId } from "../../shared/utils/requireUnidadeId";
import { AppError } from "../../shared/errors/AppError";
import { ImportarAlunosCsvService } from "./services/ImportarAlunosCsvService";


export class AlunosController {
  async previsualizarImportacao(req: Request, res: Response) {
    if (!req.file) throw new AppError("Selecione um arquivo CSV.");
    return res.json(await new ImportarAlunosCsvService().previsualizar(req.file.buffer, requireUnidadeId(req)));
  }

  async importarCsv(req: Request, res: Response) {
    if (!req.file) throw new AppError("Selecione um arquivo CSV.");
    const estrategia = req.body.estrategiaDuplicados === "ATUALIZAR" ? "ATUALIZAR" : "IGNORAR";
    const resultado = await new ImportarAlunosCsvService().confirmar(
      req.file.buffer,
      requireUnidadeId(req),
      req.file.originalname,
      estrategia
    );
    return res.status(201).json(resultado);
  }

  async desfazerImportacao(req: Request, res: Response) {
    return res.json(await new ImportarAlunosCsvService().desfazer(Number(req.params.id), requireUnidadeId(req)));
  }
  async create(req: Request, res: Response) {
    const service = new CreateAlunoService();

    const aluno = await service.execute({ ...req.body, unidadeId: requireUnidadeId(req) });

    return res.status(201).json(aluno);
  }

  async list(req: Request, res: Response) {
    const service = new ListAlunosService();
    const solicitouPaginacao = req.query.pagina !== undefined;
    const pagina = Math.max(1, Number(req.query.pagina) || 1);
    const porPagina = Math.min(100, Math.max(1, Number(req.query.porPagina) || 15));
    const alunos = solicitouPaginacao
      ? await service.execute(
          req.user.unidadeId,
          req.user.perfil,
          {
            pagina,
            porPagina,
            busca: String(req.query.busca ?? "").trim() || undefined,
            status: String(req.query.status ?? "") || undefined,
            turmaId: Number(req.query.turmaId) || undefined,
          },
        )
      : await service.execute(req.user.unidadeId, req.user.perfil);

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

    const prontuario = await service.execute(Number(id), req.user);

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

  async setSenhaPortal(req: Request, res: Response) {
    const { id } = req.params;
    const { senha } = req.body;

    const service = new SetSenhaPortalAlunoService();

    const resultado = await service.execute({ id: Number(id), senha }, req.user.unidadeId);

    return res.json(resultado);
  }
}
