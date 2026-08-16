import { Request, Response, NextFunction } from "express";
import { AppError } from "../errors/AppError";
import { erroSeguroParaLog } from "../security/sanitizarErro";

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

  console.error("Erro não tratado", erroSeguroParaLog(error));

  return res.status(500).json({
    message: "Erro interno do servidor."
  });

}
