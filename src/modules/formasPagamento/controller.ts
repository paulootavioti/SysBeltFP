import { Request, Response } from "express";

import { CreateFormaPagamentoService } from "./services/CreateFormaPagamentoService";
import { UpdateFormaPagamentoService } from "./services/UpdateFormaPagamentoService";
import { ListFormasPagamentoService } from "./services/ListFormasPagamentoService";
import { ToggleAtivoFormaPagamentoService } from "./services/ToggleAtivoFormaPagamentoService";
import { requireUnidadeId } from "../../shared/utils/requireUnidadeId";
import { resumirConfiguracao } from "../pagamentos/gateways";

// `configuracao` guarda as credenciais do gateway do cliente. Ela NUNCA
// sai numa resposta: no lugar vai um resumo que diz qual gateway está
// ligado e quais credenciais já foram preenchidas, sem revelar nenhuma.
//
// Isto vale pra toda resposta deste módulo, não só a listagem — a rota de
// listar é aberta a RECEPCAO, e create/update devolvem a linha gravada.
function semCredenciais<T extends { configuracao?: unknown }>(forma: T) {
  const { configuracao, ...resto } = forma;

  return { ...resto, gateway: resumirConfiguracao(configuracao) };
}

export class FormasPagamentoController {
  async create(req: Request, res: Response) {
    const service = new CreateFormaPagamentoService();

    const formaPagamento = await service.execute({ ...req.body, unidadeId: requireUnidadeId(req) });

    return res.status(201).json(semCredenciais(formaPagamento));
  }

  async update(req: Request, res: Response) {
    const { id } = req.params;

    const service = new UpdateFormaPagamentoService();

    const formaPagamento = await service.execute(Number(id), req.body, req.user.unidadeId);

    return res.json(semCredenciais(formaPagamento));
  }

  async list(req: Request, res: Response) {
    const service = new ListFormasPagamentoService();

    const formasPagamento = await service.execute(req.user.unidadeId);

    return res.json(formasPagamento.map(semCredenciais));
  }

  async toggleAtivo(req: Request, res: Response) {
    const { id } = req.params;

    const service = new ToggleAtivoFormaPagamentoService();

    const formaPagamento = await service.execute(Number(id), req.user.unidadeId);

    return res.json(semCredenciais(formaPagamento));
  }
}
