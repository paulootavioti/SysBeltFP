import { Request, Response } from "express";

import { CreateContratoService } from "./services/CreateContratoService";
import { UpdateContratoService } from "./services/UpdateContratoService";
import { ListContratosService } from "./services/ListContratosService";
import { GetContratoService } from "./services/GetContratoService";
import { AlterarSituacaoContratoService } from "./services/AlterarSituacaoContratoService";
import { RegistrarAssinaturaService } from "./services/RegistrarAssinaturaService";
import { RenovarContratoService } from "./services/RenovarContratoService";
import { RenovarContratosVencidosService } from "./services/RenovarContratosVencidosService";
import { requireUnidadeId } from "../../shared/utils/requireUnidadeId";

export class ContratosController {
  async create(req: Request, res: Response) {
    const service = new CreateContratoService();

    const contrato = await service.execute({
      ...req.body,
      unidadeId: requireUnidadeId(req),
      usuarioId: req.user.id,
    });

    return res.status(201).json(contrato);
  }

  async update(req: Request, res: Response) {
    const { id } = req.params;

    const service = new UpdateContratoService();

    const contrato = await service.execute(Number(id), req.user.unidadeId, {
      ...req.body,
      usuarioId: req.user.id,
    });

    return res.json(contrato);
  }

  async list(req: Request, res: Response) {
    const service = new ListContratosService();

    const { alunoId, situacao } = req.query;

    const contratos = await service.execute(req.user.unidadeId, {
      alunoId: alunoId ? Number(alunoId) : undefined,
      situacao: typeof situacao === "string" ? situacao : undefined,
    });

    return res.json(contratos);
  }

  async get(req: Request, res: Response) {
    const { id } = req.params;

    const service = new GetContratoService();

    const contrato = await service.execute(Number(id), req.user.unidadeId);

    return res.json(contrato);
  }

  async alterarSituacao(req: Request, res: Response) {
    const { id } = req.params;

    const service = new AlterarSituacaoContratoService();

    const contrato = await service.execute(
      Number(id),
      req.user.unidadeId,
      req.user.id,
      req.body.situacao,
      req.body.motivoCancelamento
    );

    return res.json(contrato);
  }

  async assinar(req: Request, res: Response) {
    const { id } = req.params;

    const service = new RegistrarAssinaturaService();

    const contrato = await service.execute(Number(id), req.user.unidadeId, req.user.id, req.body);

    return res.json(contrato);
  }

  async renovar(req: Request, res: Response) {
    const { id } = req.params;

    const service = new RenovarContratoService();

    const contrato = await service.execute(Number(id), req.user.unidadeId, {
      ...req.body,
      usuarioId: req.user.id,
    });

    return res.status(201).json(contrato);
  }

  // Disparo manual pelo ADMIN, escopado à própria unidade.
  async renovarVencidosManual(req: Request, res: Response) {
    const service = new RenovarContratosVencidosService();

    const resultado = await service.execute(req.user.unidadeId);

    return res.json(resultado);
  }

  // Disparo externo (cron), sem usuário autenticado — roda pra todas as
  // unidades. Autenticado por segredo, checado no middleware da rota.
  async renovarVencidosCron(_req: Request, res: Response) {
    const service = new RenovarContratosVencidosService();

    const resultado = await service.execute(null);

    return res.json(resultado);
  }
}
