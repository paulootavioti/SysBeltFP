import { Request, Response } from "express";

import { prismaDaRequisicao } from "../../shared/database/prismaDaRequisicao";
import { AppError } from "../../shared/errors/AppError";
import { CreateUnidadeService } from "./services/CreateUnidadeService";
import { UpdateUnidadeService } from "./services/UpdateUnidadeService";
import { ListUnidadesService } from "./services/ListUnidadesService";
import { ListUnidadesOpcoesService } from "./services/ListUnidadesOpcoesService";
import { ToggleAtivoUnidadeService } from "./services/ToggleAtivoUnidadeService";

export class UnidadesController {

  async create(req: Request, res: Response) {
    const service = new CreateUnidadeService();

    const contaId = await resolverContaDestino(req);

    const unidade = await service.execute({ nome: req.body.nome, contaId });

    return res.status(201).json(unidade);
  }

  async update(req: Request, res: Response) {
    const { id } = req.params;

    const service = new UpdateUnidadeService();

    const unidade = await service.execute(Number(id), await resolverContaDestino(req), req.body);

    return res.json(unidade);
  }

  async list(req: Request, res: Response) {
    const service = new ListUnidadesService();

    const unidades = await service.execute(await resolverContaDestino(req));

    return res.json(unidades);
  }

  async listarOpcoes(req: Request, res: Response) {
    const service = new ListUnidadesOpcoesService();

    const unidades = await service.execute(req.user.unidadeId);

    return res.json(unidades);
  }

  async toggleAtivo(req: Request, res: Response) {
    const { id } = req.params;

    const service = new ToggleAtivoUnidadeService();

    const unidade = await service.execute(Number(id), await resolverContaDestino(req));

    return res.json(unidade);
  }

}

async function resolverContaDestino(req: Request): Promise<number> {
  const prisma = prismaDaRequisicao();
  if (req.user.unidadeId) {
    const unidadeAtual = await prisma.unidade.findUnique({
      where: { id: req.user.unidadeId },
      select: { contaId: true },
    });

    if (!unidadeAtual) {
      throw new AppError("Unidade ativa não encontrada.", 404);
    }

    return unidadeAtual.contaId;
  }

  throw new AppError("Selecione uma unidade ativa para administrar as filiais.", 400);
}
