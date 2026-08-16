import { Request, Response, NextFunction } from "express";

import { AppError } from "../errors/AppError";
import { prismaDaRequisicao } from "../database/prismaDaRequisicao";
import { PERFIS_MULTI_UNIDADE } from "../constants/perfis";
import { definirUsuarioDoContexto } from "../context/contextoRequisicao";
import { verificarTokenDaRequisicao } from "../tenant/tokenDaRequisicao";
import { garantirAcessoSuperadminLegado } from "../security/superadminLegado";

interface TokenPayload {
  sub: string;
  perfil: string;
}

export async function ensureAuthenticated(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const prisma = prismaDaRequisicao();
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    throw new AppError("Token não informado.", 401);
  }

  const [, token] = authHeader.split(" ");

  try {
    const decoded = verificarTokenDaRequisicao<TokenPayload>(token, "sysbelt-web");

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

    garantirAcessoSuperadminLegado(usuario.perfil);

    req.user = {
      id: usuario.id,
      perfil: usuario.perfil,
      unidadeId: usuario.unidadeId
    };

    definirUsuarioDoContexto(usuario.id);

    if (PERFIS_MULTI_UNIDADE.includes(usuario.perfil) && req.headers["x-unidade-id"]) {
      // Perfis multiunidade podem trocar a unidade ativa somente quando
      // existe vínculo explícito em UsuarioUnidade.
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
