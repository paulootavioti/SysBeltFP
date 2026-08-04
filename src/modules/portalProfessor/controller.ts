import { Request, Response } from "express";

import { AppError } from "../../shared/errors/AppError";
import { GetAulasHojeProfessorService } from "./services/GetAulasHojeProfessorService";
import { GetAulaProfessorService } from "./services/GetAulaProfessorService";
import { MarcarPresencaProfessorService } from "./services/MarcarPresencaProfessorService";
import { MarcarTecnicaProfessorService } from "./services/MarcarTecnicaProfessorService";
import { CriarNotaAulaService } from "./services/CriarNotaAulaService";
import { RegistrarObservacaoAulaService } from "./services/RegistrarObservacaoAulaService";
import { PublicarFotoAulaProfessorService } from "./services/PublicarFotoAulaProfessorService";
import { FinalizarAulaProfessorService } from "./services/FinalizarAulaProfessorService";

export class PortalProfessorController {
  async hoje(req: Request, res: Response) {
    const service = new GetAulasHojeProfessorService();
    const resultado = await service.execute(req.user);
    return res.json(resultado);
  }

  async aula(req: Request, res: Response) {
    const service = new GetAulaProfessorService();
    const aula = await service.execute(Number(req.params.id), req.user);
    return res.json(aula);
  }

  async presenca(req: Request, res: Response) {
    const service = new MarcarPresencaProfessorService();
    const registro = await service.execute(Number(req.params.id), req.body, req.user);
    return res.json(registro);
  }

  async tecnicas(req: Request, res: Response) {
    const service = new MarcarTecnicaProfessorService();
    const aula = await service.execute(Number(req.params.id), req.body, req.user);
    return res.json(aula);
  }

  async notas(req: Request, res: Response) {
    const service = new CriarNotaAulaService();
    const nota = await service.execute(Number(req.params.id), req.body, req.user);
    return res.status(201).json(nota);
  }

  async observacao(req: Request, res: Response) {
    const service = new RegistrarObservacaoAulaService();
    const aula = await service.execute(Number(req.params.id), req.body.texto, req.user);
    return res.json(aula);
  }

  async foto(req: Request, res: Response) {
    if (!req.file) {
      throw new AppError("Nenhuma foto enviada.");
    }

    const service = new PublicarFotoAulaProfessorService();
    const resultado = await service.execute(
      {
        aulaId: Number(req.params.id),
        buffer: req.file.buffer,
        mimetype: req.file.mimetype,
        legenda: req.body.legenda,
        visivelNaLanding: req.body.visivelNaLanding,
      },
      req.user
    );

    return res.status(201).json(resultado);
  }

  async finalizar(req: Request, res: Response) {
    const service = new FinalizarAulaProfessorService();
    const resumo = await service.execute(Number(req.params.id), req.user, req.body?.observacoes);
    return res.json(resumo);
  }
}
