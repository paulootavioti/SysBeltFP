import { Request, Response } from "express";

import { prisma } from "../../shared/database/prisma";
import { AppError } from "../../shared/errors/AppError";
import { CreateUnidadeService } from "./services/CreateUnidadeService";
import { UpdateUnidadeService } from "./services/UpdateUnidadeService";
import { ListUnidadesService } from "./services/ListUnidadesService";
import { ListUnidadesOpcoesService } from "./services/ListUnidadesOpcoesService";
import { ToggleAtivoUnidadeService } from "./services/ToggleAtivoUnidadeService";

export class UnidadesController {

  async create(req: Request, res: Response) {
    const service = new CreateUnidadeService();

    // A conta vem da unidade ativa de quem está criando — um ADMIN abre
    // filial na própria conta e não pode escolher outra. Só o SUPERADMIN
    // (que não tem unidade fixa) informa a conta no corpo.
    const contaId = await resolverContaDestino(req);

    const unidade = await service.execute({ nome: req.body.nome, contaId });

    return res.status(201).json(unidade);
  }

  async update(req: Request, res: Response) {
    const { id } = req.params;

    const service = new UpdateUnidadeService();

    const unidade = await service.execute(Number(id), req.body);

    return res.json(unidade);
  }

  async list(req: Request, res: Response) {
    const service = new ListUnidadesService();

    const unidades = await service.execute();

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

    const unidade = await service.execute(Number(id));

    return res.json(unidade);
  }

}

async function resolverContaDestino(req: Request): Promise<number> {
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

  if (req.user.perfil === "SUPERADMIN" && req.body.contaId) {
    return Number(req.body.contaId);
  }

  throw new AppError("Informe a conta em que a unidade será criada.");
}
