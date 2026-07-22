import { Request, Response } from "express";

import { AppError } from "../../shared/errors/AppError";
import { UploadFotoService } from "./services/UploadFotoService";
import { GetFotoService } from "./services/GetFotoService";

export class UploadsController {
  async uploadFoto(req: Request, res: Response) {
    if (!req.file) {
      throw new AppError("Nenhum arquivo enviado.");
    }

    const prefixo = req.body.prefixo === "responsaveis" ? "responsaveis" : "alunos";

    const service = new UploadFotoService();

    const resultado = await service.execute({
      buffer: req.file.buffer,
      mimetype: req.file.mimetype,
      prefixo,
    });

    return res.status(201).json(resultado);
  }

  async getFoto(req: Request, res: Response) {
    const prefixo = String(req.params.prefixo);

    if (!["alunos", "responsaveis"].includes(prefixo)) {
      throw new AppError("Imagem não encontrada.", 404);
    }

    const chave = `${prefixo}/${req.params.arquivo}`;

    const service = new GetFotoService();

    const foto = await service.execute(chave);

    res.setHeader("Content-Type", foto.contentType);
    res.setHeader("Cache-Control", "private, max-age=86400");

    return res.send(foto.buffer);
  }
}
