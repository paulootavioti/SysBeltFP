import { Request, Response, NextFunction } from "express";
import { AppError } from "../errors/AppError";
import { logger } from "../observability/logger";

export function errorHandler(
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {

  if (error instanceof AppError) {

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
