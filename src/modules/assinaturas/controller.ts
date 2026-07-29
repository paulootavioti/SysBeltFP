import { Request, Response } from "express";

import { CreateAssinaturaService } from "./services/CreateAssinaturaService";
import { UpdateAssinaturaService } from "./services/UpdateAssinaturaService";
import { ListAssinaturasService } from "./services/ListAssinaturasService";
import { AlterarStatusAssinaturaService } from "./services/AlterarStatusAssinaturaService";
import { GerarCobrancasRecorrentesService } from "./services/GerarCobrancasRecorrentesService";
import { requireUnidadeId } from "../../shared/utils/requireUnidadeId";

export class AssinaturasController {
  async create(req: Request, res: Response) {
    const service = new CreateAssinaturaService();

    const assinatura = await service.execute({ ...req.body, unidadeId: requireUnidadeId(req) });

    return res.status(201).json(assinatura);
  }

  async update(req: Request, res: Response) {
    const { id } = req.params;

    const service = new UpdateAssinaturaService();

    const assinatura = await service.execute(Number(id), req.body, req.user.unidadeId);

    return res.json(assinatura);
  }

  async list(req: Request, res: Response) {
    const service = new ListAssinaturasService();

    const assinaturas = await service.execute(req.user.unidadeId);

    return res.json(assinaturas);
  }

  async alterarStatus(req: Request, res: Response) {
    const { id } = req.params;

    const service = new AlterarStatusAssinaturaService();

    const assinatura = await service.execute(Number(id), req.user.unidadeId, req.body.status);

    return res.json(assinatura);
  }

  // Disparo manual pelo ADMIN, escopado à própria unidade — útil pra
  // testar/forçar a geração sem esperar o disparo externo (cron).
  async gerarCobrancasManual(req: Request, res: Response) {
    const service = new GerarCobrancasRecorrentesService();

    const resultado = await service.execute(req.user.unidadeId);

    return res.json(resultado);
  }

  // Disparo externo (cron), sem usuário autenticado — roda pra todas as
  // unidades. Autenticado por segredo, checado no middleware da rota.
  async gerarCobrancasCron(req: Request, res: Response) {
    const service = new GerarCobrancasRecorrentesService();

    const resultado = await service.execute(null);

    return res.json(resultado);
  }
}
