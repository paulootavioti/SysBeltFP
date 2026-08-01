import { Request, Response } from "express";

import { prisma } from "../../shared/database/prisma";
import { ListMensagensFamiliaService } from "../portalFamilia/services/ListMensagensFamiliaService";
import { EnviarMensagemFamiliaService } from "../portalFamilia/services/EnviarMensagemFamiliaService";

export class MensagensFamiliaController {
  async list(req: Request, res: Response) {
    const { alunoId } = req.query;

    const service = new ListMensagensFamiliaService();

    const mensagens = await service.execute(Number(alunoId), req.user.unidadeId);

    return res.json(mensagens);
  }

  async enviar(req: Request, res: Response) {
    const { alunoId, texto } = req.body;

    const usuario = await prisma.usuario.findUniqueOrThrow({ where: { id: req.user.id } });

    const service = new EnviarMensagemFamiliaService();

    const mensagem = await service.execute({
      alunoId: Number(alunoId),
      texto,
      remetenteTipo: "ACADEMIA",
      remetenteNome: usuario.apelido || usuario.nome,
      unidadeIdSolicitante: req.user.unidadeId,
    });

    return res.status(201).json(mensagem);
  }
}
