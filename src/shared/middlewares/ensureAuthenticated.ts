import { Request, Response, NextFunction } from "express";
import { verify } from "jsonwebtoken";

import { AppError } from "../errors/AppError";
import { prisma } from "../database/prisma";

interface TokenPayload {
  sub: string;
  perfil: string;
}

export async function ensureAuthenticated(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    throw new AppError("Token não informado.", 401);
  }

  const [, token] = authHeader.split(" ");

  try {
    const decoded = verify(
      token,
      process.env.JWT_SECRET as string
    ) as TokenPayload;

    const usuario = await prisma.usuario.findUnique({
      where: {
        id: Number(decoded.sub)
      }
    });

    if (!usuario) {
      throw new AppError("Usuário não encontrado.", 401);
    }

    if (!usuario.ativo) {
      throw new AppError("Usuário inativo.", 403);
    }

    req.user = {
      id: usuario.id,
      perfil: usuario.perfil,
      unidadeId: usuario.unidadeId
    };

    return next();

  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError("Token inválido.", 401);
  }
}