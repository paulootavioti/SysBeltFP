import { Request } from "express";
import { AppError } from "../errors/AppError";

// cadastros de primeiro nível (aluno, turma, plano, etc.) exigem uma
// unidade concreta — um SUPERADMIN (sem unidade fixa) não cadastra esse
// tipo de dado diretamente, só administra as unidades em si.
export function requireUnidadeId(req: Request): number {
  if (!req.user.unidadeId) {
    throw new AppError(
      "Esta ação não está disponível para o superadmin sem uma unidade selecionada."
    );
  }

  return req.user.unidadeId;
}
