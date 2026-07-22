import { Request, Response, NextFunction } from "express";
import { ZodType } from "zod";
import { AppError } from "../errors/AppError";

export function validateBody(schema: ZodType) {
  return (req: Request, res: Response, next: NextFunction) => {
    const resultado = schema.safeParse(req.body);

    if (!resultado.success) {
      const mensagem = resultado.error.issues[0]?.message ?? "Dados inválidos.";
      throw new AppError(mensagem);
    }

    req.body = resultado.data;
    next();
  };
}
