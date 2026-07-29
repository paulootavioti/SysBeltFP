import { Request, Response } from "express";

import { CreateFormaPagamentoService } from "./services/CreateFormaPagamentoService";
import { UpdateFormaPagamentoService } from "./services/UpdateFormaPagamentoService";
import { ListFormasPagamentoService } from "./services/ListFormasPagamentoService";
import { ToggleAtivoFormaPagamentoService } from "./services/ToggleAtivoFormaPagamentoService";
import { requireUnidadeId } from "../../shared/utils/requireUnidadeId";

export class FormasPagamentoController {
  async create(req: Request, res: Response) {
    const service = new CreateFormaPagamentoService();

    const formaPagamento = await service.execute({ ...req.body, unidadeId: requireUnidadeId(req) });

    return res.status(201).json(formaPagamento);
  }

  async update(req: Request, res: Response) {
    const { id } = req.params;

    const service = new UpdateFormaPagamentoService();

    const formaPagamento = await service.execute(Number(id), req.body, req.user.unidadeId);

    return res.json(formaPagamento);
  }

  async list(req: Request, res: Response) {
    const service = new ListFormasPagamentoService();

    const formasPagamento = await service.execute(req.user.unidadeId);

    return res.json(formasPagamento);
  }

  async toggleAtivo(req: Request, res: Response) {
    const { id } = req.params;

    const service = new ToggleAtivoFormaPagamentoService();

    const formaPagamento = await service.execute(Number(id), req.user.unidadeId);

    return res.json(formaPagamento);
  }
}
