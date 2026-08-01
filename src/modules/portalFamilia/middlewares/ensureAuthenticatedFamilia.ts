import { Request, Response, NextFunction } from "express";
import { verify } from "jsonwebtoken";

import { AppError } from "../../../shared/errors/AppError";
import { prisma } from "../../../shared/database/prisma";

interface TokenPayloadFamilia {
  tipo: "RESPONSAVEL" | "ALUNO";
  email: string;
}

declare global {
  namespace Express {
    interface Request {
      familia?: {
        tipo: "RESPONSAVEL" | "ALUNO";
        email: string;
        nome: string;
        alunoIds: number[];
      };
    }
  }
}

// Guard próprio do Portal da Família — não reaproveita ensureAuthenticated
// porque a sessão da família não é uma linha em Usuario, é Responsavel ou
// Aluno. A cada requisição, re-deriva o escopo de alunoIds a partir do
// banco (não confia no que veio no token) — mesma cautela de
// ensureAuthenticated: se um vínculo for desfeito, a sessão já não vê mais
// aquele aluno na próxima requisição, sem esperar o token expirar.
export async function ensureAuthenticatedFamilia(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    throw new AppError("Token não informado.", 401);
  }

  const [, token] = authHeader.split(" ");

  let decoded: TokenPayloadFamilia;

  try {
    decoded = verify(token, process.env.JWT_SECRET as string) as TokenPayloadFamilia;
  } catch {
    throw new AppError("Token inválido.", 401);
  }

  if (decoded.tipo === "RESPONSAVEL") {
    const responsaveis = await prisma.responsavel.findMany({
      where: { email: decoded.email, ativo: true },
    });

    if (responsaveis.length === 0) {
      throw new AppError("Sessão inválida.", 401);
    }

    req.familia = {
      tipo: "RESPONSAVEL",
      email: decoded.email,
      nome: responsaveis[0].nome,
      alunoIds: Array.from(new Set(responsaveis.map((item) => item.alunoId))),
    };

    return next();
  }

  const aluno = await prisma.aluno.findFirst({
    where: { email: decoded.email, ativo: true },
  });

  if (!aluno) {
    throw new AppError("Sessão inválida.", 401);
  }

  req.familia = {
    tipo: "ALUNO",
    email: decoded.email,
    nome: aluno.nome,
    alunoIds: [aluno.id],
  };

  return next();
}
