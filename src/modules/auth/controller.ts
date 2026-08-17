import { Request, Response } from "express";

import { CreateUsuarioService } from "./services/CreateUsuarioService";
import { LoginService } from "./services/LoginService";
import { AppError } from "../../shared/errors/AppError";
import { PERFIS_MULTI_UNIDADE } from "../../shared/constants/perfis";
import { garantirConcessaoSuperadminPermitida } from "../../shared/security/superadminLegado";
import { normalizarUnidadesDoAssinante } from "../usuarios/utils/normalizarUnidadesDoAssinante";

export class AuthController {
  async register(req: Request, res: Response) {
    garantirConcessaoSuperadminPermitida(req.body.perfil, req.user.perfil);

    const unidadeIdsBrutos = (await normalizarUnidadesDoAssinante(
      req.body.unidadeIds,
      req.user.unidadeId
    )) ?? [];

    if (unidadeIdsBrutos.length > 1 && !PERFIS_MULTI_UNIDADE.includes(req.body.perfil)) {
      throw new AppError("Só usuários Admin, Professor ou Recepção podem ser vinculados a mais de uma unidade.");
    }

    const unidadeId = unidadeIdsBrutos[0] ?? req.user.unidadeId;

    if (!unidadeId && req.body.perfil !== "SUPERADMIN") {
      throw new AppError("Informe a unidade para este usuário.");
    }

    const service = new CreateUsuarioService();

    const usuario = await service.execute({ ...req.body, unidadeId, unidadeIds: unidadeIdsBrutos });

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
