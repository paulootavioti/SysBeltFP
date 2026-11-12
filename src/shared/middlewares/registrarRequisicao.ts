import type { NextFunction, Request, Response } from "express";

import { logger } from "../observability/logger";

// Acima disso a requisição é registrada como lenta e vira alerta. É o
// critério do piloto em docs/prontidao-lancamento.md (p95 < 800 ms).
export const LIMITE_REQUISICAO_LENTA_MS = 800;

export function registrarRequisicao(req: Request, res: Response, next: NextFunction) {
  const inicio = performance.now();
  res.on("finish", () => {
    const dados = {
      metodo: req.method,
      rota: req.originalUrl.split("?")[0],
      status: res.statusCode,
      duracaoMs: Math.round(performance.now() - inicio),
      unidadeId: req.user?.unidadeId ?? null,
    };
    logger.info("http_request", dados);
    if (dados.duracaoMs > LIMITE_REQUISICAO_LENTA_MS) logger.warn("requisicao_lenta", dados);
  });
  next();
}
