import type { NextFunction, Request, Response } from "express";

import { logger } from "../observability/logger";

export function registrarRequisicao(req: Request, res: Response, next: NextFunction) {
  const inicio = performance.now();
  res.on("finish", () => {
    logger.info("http_request", {
      metodo: req.method,
      rota: req.originalUrl.split("?")[0],
      status: res.statusCode,
      duracaoMs: Math.round(performance.now() - inicio),
    });
  });
  next();
}
