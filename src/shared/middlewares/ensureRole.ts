import { Request, Response, NextFunction } from "express";
import { AppError } from "../errors/AppError";

export function ensureRole(
  roles: string[]
) {

  return (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {

    // superadmin enxerga e administra todas as unidades — não faz sentido
    // listar "SUPERADMIN" em toda rota já restrita a ADMIN.
    if (
      req.user.perfil !== "SUPERADMIN" &&
      !roles.includes(req.user.perfil)
    ) {
      throw new AppError(
        "Acesso negado.",
        403
      );
    }

    next();

  };

}