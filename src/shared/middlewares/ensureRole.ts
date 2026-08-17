import { Request, Response, NextFunction } from "express";
import { AppError } from "../errors/AppError";
import { PERFIS_QUE_HERDAM } from "../constants/perfis";

export function ensureRole(roles: string[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (roles.includes(req.user.perfil)) {
      return next();
    }

    // O DONO da academia passa onde um ADMIN dela passa. Sem isso, toda
    // rota existente precisaria ser reescrita pra citar os dois perfis, e
    // a que alguém esquecesse ficaria fechada pro dono sem motivo.
    const herdados = PERFIS_QUE_HERDAM[req.user.perfil] ?? [];

    if (herdados.some((perfil) => roles.includes(perfil))) {
      return next();
    }

    throw new AppError("Acesso negado.", 403);
  };
}
