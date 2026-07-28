import { Request, Response, NextFunction } from "express";
import { verify } from "jsonwebtoken";

import { AppError } from "../errors/AppError";
import { prisma } from "../database/prisma";
import { PERFIS_MULTI_UNIDADE } from "../constants/perfis";

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

    // SUPERADMIN pode "visualizar como" uma unidade específica — o frontend
    // manda o id escolhido nesse header, e a partir daqui toda a cadeia de
    // escopo (escopoUnidade, garantirAcessoUnidade, requireUnidadeId) passa
    // a enxergar só aquela unidade, sem precisar mudar nada nos services.
    if (usuario.perfil === "SUPERADMIN") {
      const unidadeVisualizada = Number(req.headers["x-unidade-id"]);
      if (Number.isInteger(unidadeVisualizada) && unidadeVisualizada > 0) {
        req.user.unidadeId = unidadeVisualizada;
      }
    } else if (PERFIS_MULTI_UNIDADE.includes(usuario.perfil) && req.headers["x-unidade-id"]) {
      // ADMIN/PROFESSOR/RECEPCAO vinculado a mais de uma unidade pode trocar
      // qual unidade está ativa — mas só entre as unidades que ele de fato
      // tem vínculo (UsuarioUnidade), diferente do SUPERADMIN, que é
      // irrestrito.
      const unidadeSolicitada = Number(req.headers["x-unidade-id"]);

      if (Number.isInteger(unidadeSolicitada) && unidadeSolicitada > 0) {
        const vinculo = await prisma.usuarioUnidade.findFirst({
          where: { usuarioId: usuario.id, unidadeId: unidadeSolicitada },
        });

        if (vinculo) {
          req.user.unidadeId = unidadeSolicitada;
        }
      }
    }

    return next();

  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError("Token inválido.", 401);
  }
}