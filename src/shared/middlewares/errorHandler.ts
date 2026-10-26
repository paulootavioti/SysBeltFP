import { Request, Response, NextFunction } from "express";
import { AppError } from "../errors/AppError";
import { logger } from "../observability/logger";

export function errorHandler(
  error: Error,
  req: Request,
  res: Response,
  _next: NextFunction
) {

  if (error instanceof AppError) {
    // 5xx de AppError é configuração faltando ou dependência fora do ar
    // (ex.: provedor não configurado): merece alerta, não só a resposta.
    if (error.statusCode >= 500) {
      logger.error("erro_servico", error, { metodo: req.method, rota: req.originalUrl.split("?")[0], status: error.statusCode });
    }

    return res.status(error.statusCode).json({
      message: error.message
    });

  }

  logger.error("erro_nao_tratado", error, { metodo: req.method, rota: req.originalUrl.split("?")[0] });

  return res.status(500).json({
    message: "Erro interno do servidor.",
    requestId: res.getHeader("X-Request-Id"),
  });

}
