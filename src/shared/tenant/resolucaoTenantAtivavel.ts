import type { NextFunction, Request, RequestHandler, Response } from "express";
import { resolucaoTenantMiddleware } from "./infraTenant";

export function criarResolucaoTenantAtivavel(
  env: NodeJS.ProcessEnv = process.env,
  criarMiddleware: () => RequestHandler = resolucaoTenantMiddleware,
): RequestHandler {
  const habilitada = env.TENANT_RESOLUTION_ENABLED === "true";
  const obrigatoria = env.TENANT_RESOLUTION_REQUIRED === "true";
  if (obrigatoria && !habilitada) {
    throw new Error("TENANT_RESOLUTION_REQUIRED exige TENANT_RESOLUTION_ENABLED.");
  }
  if (!habilitada) return (_request: Request, _response: Response, next: NextFunction) => next();
  let middleware: RequestHandler | undefined;
  return (request, response, next) => {
    middleware ??= criarMiddleware();
    return middleware(request, response, next);
  };
}
