import { Request, Response } from "express";

import { AppError } from "../../shared/errors/AppError";
import { PublicarFotosTreinoService } from "./services/PublicarFotosTreinoService";
import { ListFotosTreinoService } from "./services/ListFotosTreinoService";
import { ToggleVisibilidadeFotoTreinoService } from "./services/ToggleVisibilidadeFotoTreinoService";
import { ExcluirFotoTreinoService } from "./services/ExcluirFotoTreinoService";

export class FotosTreinoController {

  async publicar(req: Request, res: Response) {
    const service = new PublicarFotosTreinoService();

    const resultado = await service.execute(req.body, req.user);

    return res.status(201).json(resultado);
  }

  async list(req: Request, res: Response) {
    if (!req.query.aulaId) {
      throw new AppError("Informe a aula.");
    }

    const service = new ListFotosTreinoService();

    const fotos = await service.execute(Number(req.query.aulaId), req.user);

    return res.json(fotos);
  }

  async toggleVisibilidade(req: Request, res: Response) {
    const { id } = req.params;

    const service = new ToggleVisibilidadeFotoTreinoService();

    const foto = await service.execute(Number(id), req.user);

    return res.json(foto);
  }

  async excluir(req: Request, res: Response) {
    const { id } = req.params;

    const service = new ExcluirFotoTreinoService();

    await service.execute(Number(id), req.user);

    return res.status(204).send();
  }

}
