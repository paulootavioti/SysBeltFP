import { Request, Response } from "express";

import { CreateEventoService } from "./services/CreateEventoService";
import { ListEventosService } from "./services/ListEventosService";
import { GetEventoService } from "./services/GetEventoService";
import { UpdateEventoService } from "./services/UpdateEventoService";
import { DeleteEventoService } from "./services/DeleteEventoService";
import { requireUnidadeId } from "../../shared/utils/requireUnidadeId";
import type { StatusEvento, TipoEvento } from "./constants";

function numeroOuUndefined(valor: unknown): number | undefined {
  if (valor === undefined || valor === null || valor === "") return undefined;
  return Number(valor);
}

export class EventosController {
  async list(req: Request, res: Response) {
    const service = new ListEventosService();

    const eventos = await service.execute(req.user.unidadeId, {
      busca: req.query.busca ? String(req.query.busca) : undefined,
      tipo: req.query.tipo ? (String(req.query.tipo) as TipoEvento) : undefined,
      status: req.query.status ? (String(req.query.status) as StatusEvento) : undefined,
      dataInicial: req.query.dataInicial ? String(req.query.dataInicial) : undefined,
      dataFinal: req.query.dataFinal ? String(req.query.dataFinal) : undefined,
    });

    return res.json(eventos);
  }

  async get(req: Request, res: Response) {
    const { id } = req.params;

    const service = new GetEventoService();
    const evento = await service.execute(Number(id), req.user.unidadeId);

    return res.json(evento);
  }

  async create(req: Request, res: Response) {
    const { titulo, descricao, tipo, status, dataInicio, dataFim, local, responsavel } = req.body;

    const service = new CreateEventoService();
    const evento = await service.execute({
      unidadeId: requireUnidadeId(req),
      titulo,
      descricao,
      tipo,
      status,
      dataInicio,
      dataFim,
      local,
      responsavel,
      metaParticipantes: numeroOuUndefined(req.body.metaParticipantes),
      participantesConfirmados: numeroOuUndefined(req.body.participantesConfirmados),
      investimento: numeroOuUndefined(req.body.investimento),
      receitaGerada: numeroOuUndefined(req.body.receitaGerada),
    });

    return res.status(201).json(evento);
  }

  async update(req: Request, res: Response) {
    const { id } = req.params;
    const { titulo, descricao, tipo, status, dataInicio, dataFim, local, responsavel } = req.body;

    const service = new UpdateEventoService();
    const evento = await service.execute({
      id: Number(id),
      unidadeIdUsuario: req.user.unidadeId,
      titulo,
      descricao,
      tipo,
      status,
      dataInicio,
      dataFim,
      local,
      responsavel,
      metaParticipantes: numeroOuUndefined(req.body.metaParticipantes),
      participantesConfirmados: numeroOuUndefined(req.body.participantesConfirmados),
      investimento: numeroOuUndefined(req.body.investimento),
      receitaGerada: numeroOuUndefined(req.body.receitaGerada),
    });

    return res.json(evento);
  }

  async delete(req: Request, res: Response) {
    const { id } = req.params;

    const service = new DeleteEventoService();
    await service.execute(Number(id), req.user.unidadeId);

    return res.status(204).send();
  }
}
