import type { Request, Response } from "express";
import { ComandosVozService } from "./service";

const service = new ComandosVozService();
export class ComandosVozController {
  async listar(req: Request, res: Response) { return res.json(await service.listar(req.user.unidadeId)); }
  async criar(req: Request, res: Response) { return res.status(201).json(await service.criar(req.body, req.user.unidadeId)); }
  async atualizar(req: Request, res: Response) { return res.json(await service.atualizar(Number(req.params.id), req.body, req.user.unidadeId)); }
  async parear(req: Request, res: Response) { return res.status(201).json(await service.parear(req.body.arenaId, req.user.id, req.user.unidadeId)); }
  async testar(req: Request, res: Response) { return res.json(await service.testar(Number(req.params.id), req.body.arenaId, req.user.unidadeId)); }
  async skill(req: Request, res: Response) { return res.json(await service.executarSkill(String(req.params.token), req.body)); }
}
