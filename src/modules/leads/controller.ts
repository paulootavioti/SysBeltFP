import { Request, Response } from "express";
import { ListLeadsService } from "./services/ListLeadsService";
import { CanalCaptacaoService } from "./services/CanalCaptacaoService";
import { listarLeadsQuerySchema } from "./validation";
import { requireUnidadeId } from "../../shared/utils/requireUnidadeId";
import { ConverterLeadService } from "./services/ConverterLeadService";
import { AgendarExperimentalLeadService } from "./services/AgendarExperimentalLeadService";
import { AtualizarStatusLeadService } from "./services/AtualizarStatusLeadService";

export class LeadsController {
  async list(req: Request, res: Response) {
    const service = new ListLeadsService();

    const filtros = listarLeadsQuerySchema.parse(req.query);
    const leads = await service.execute(req.user.unidadeId, filtros);

    return res.json(leads);
  }

  async listarCanais(req: Request, res: Response) {
    return res.json(await new CanalCaptacaoService().listar(req.user.unidadeId));
  }

  async criarCanal(req: Request, res: Response) {
    return res.status(201).json(await new CanalCaptacaoService().criar(requireUnidadeId(req), req.body));
  }

  async atualizarCanal(req: Request, res: Response) {
    return res.json(await new CanalCaptacaoService().atualizar(Number(req.params.id), req.user.unidadeId, req.body));
  }

  async converter(req: Request, res: Response) {
    return res.json(await new ConverterLeadService().execute(Number(req.params.id), req.user.unidadeId, req.user.id, req.body));
  }

  async agendarExperimental(req: Request, res: Response) {
    return res.json(await new AgendarExperimentalLeadService().execute(Number(req.params.id), req.user.unidadeId, req.user.id, new Date(req.body.data)));
  }

  async atualizarEstagio(req: Request, res: Response) {
    return res.json(await new AtualizarStatusLeadService().execute(
      Number(req.params.id), req.body.estagio, req.user.unidadeId, req.user.id, req.body.motivoPerda,
    ));
  }
}
