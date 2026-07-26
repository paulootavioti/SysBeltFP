import { Request, Response } from "express";

import { CreateUsuarioService } from "./services/CreateUsuarioService";
import { LoginService } from "./services/LoginService";
import { AppError } from "../../shared/errors/AppError";

export class AuthController {
  async register(req: Request, res: Response) {
    // um ADMIN sempre cadastra dentro da própria unidade; só um SUPERADMIN
    // (sem unidade fixa) pode e precisa informar em qual unidade o novo
    // usuário entra.
    const unidadeId = req.user.unidadeId ?? req.body.unidadeId ?? null;

    if (!unidadeId) {
      throw new AppError("Informe a unidade para este usuário.");
    }

    const service = new CreateUsuarioService();

    const usuario = await service.execute({ ...req.body, unidadeId });

    return res.status(201).json({
      id: usuario.id,
      nome: usuario.nome,
      apelido: usuario.apelido,
      email: usuario.email,
      perfil: usuario.perfil,
      nivelGraduacao: usuario.nivelGraduacao,
      outrasGraduacoes: usuario.outrasGraduacoes,
      fotoUrl: usuario.fotoUrl
    });
  }

  async login(req: Request, res: Response) {
    const service = new LoginService();

    const resultado = await service.execute(req.body);

    return res.json(resultado);
  }
}