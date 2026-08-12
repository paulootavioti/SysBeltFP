import { NextFunction, Request, Response } from "express";

import { AppError } from "../../shared/errors/AppError";
import { tenantTemRecurso } from "./recursos";
import type { RecursoConcessao } from "./concessaoContrato";

export function exigirRecursoTenant(
  recurso: RecursoConcessao,
  temRecurso: typeof tenantTemRecurso = tenantTemRecurso,
) {
  return async (_request: Request, _response: Response, next: NextFunction) => {
    if (!(await temRecurso(recurso))) {
      return next(new AppError("Recurso não disponível para esta assinatura.", 403));
    }
    return next();
  };
}
