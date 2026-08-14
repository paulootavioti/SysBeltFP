import { Request, Response, NextFunction } from "express";

import { AppError } from "../../../shared/errors/AppError";
import { prismaDaRequisicao } from "../../../shared/database/prismaDaRequisicao";
import { calcularEscopoFamilia } from "../utils/calcularEscopoFamilia";
import { verificarTokenDaRequisicao } from "../../../shared/tenant/tokenDaRequisicao";

interface TokenPayloadFamilia {
  email: string;
  comoAluno: boolean;
  comoResponsavel: boolean;
}

declare global {
  namespace Express {
    interface Request {
      familia?: {
        nome: string;
        alunoIds: number[];
      };
    }
  }
}

// Guard próprio do Portal da Família — não reaproveita ensureAuthenticated
// porque a sessão da família não é uma linha em Usuario, é Responsavel ou
// Aluno. A cada requisição, re-deriva o escopo de alunoIds a partir do
// banco (não confia no que veio no token) usando a mesma lógica de
// calcularEscopoFamilia do login — inclusive a regra de maioridade: se um
// aluno vinculado ao responsável completa 18 anos, ou se um vínculo for
// desfeito, a sessão já não vê mais aquele aluno na próxima requisição,
// sem esperar o token expirar. "comoAluno"/"comoResponsavel" só dizem
// quais senhas foram provadas no login (isso não muda durante a sessão);
// o que cada uma delas dá direito de ver é sempre recalculado na hora.
export async function ensureAuthenticatedFamilia(req: Request, res: Response, next: NextFunction) {
  const prisma = prismaDaRequisicao();
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    throw new AppError("Token não informado.", 401);
  }

  const [, token] = authHeader.split(" ");

  let decoded: TokenPayloadFamilia;

  try {
    decoded = verificarTokenDaRequisicao<TokenPayloadFamilia>(token, "sysbelt-familia");
  } catch {
    throw new AppError("Token inválido.", 401);
  }

  const responsaveis = decoded.comoResponsavel
    ? await prisma.responsavel.findMany({
        where: { email: decoded.email, ativo: true },
        include: { aluno: true },
      })
    : [];

  const alunoProprio = decoded.comoAluno
    ? await prisma.aluno.findFirst({ where: { email: decoded.email, ativo: true } })
    : null;

  const escopo = calcularEscopoFamilia({
    comoAluno: decoded.comoAluno,
    comoResponsavel: decoded.comoResponsavel,
    alunoProprio,
    responsaveis,
  });

  if (escopo.alunos.length === 0) {
    throw new AppError("Sessão inválida.", 401);
  }

  req.familia = {
    nome: escopo.nome,
    alunoIds: escopo.alunos.map((aluno) => aluno.id),
  };

  return next();
}
