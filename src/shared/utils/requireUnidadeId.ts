import { Request } from "express";
import { AppError } from "../errors/AppError";

// cadastros de primeiro nível (aluno, turma, plano, etc.) exigem uma
// unidade concreta. O DONO pode consultar a conta inteira, mas precisa
// selecionar uma filial antes de criar dados operacionais.
export function requireUnidadeId(req: Request): number {
  if (!req.user.unidadeId) {
    throw new AppError(
      "Selecione uma unidade ativa para realizar esta ação."
    );
  }

  return req.user.unidadeId;
}
