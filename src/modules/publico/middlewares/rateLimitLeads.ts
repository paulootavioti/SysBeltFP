import { Request, Response, NextFunction } from "express";

import { AppError } from "../../../shared/errors/AppError";

// Rate limit simples em memória — o único POST público exposto à internet
// deste módulo. Não traz uma lib nova (express-rate-limit não está
// instalado) pra um único endpoint; suficiente pra conter abuso básico de
// um processo Node de vida curta (Netlify Functions), sem persistência
// entre invocações frias.
const JANELA_MS = 10 * 60 * 1000;
const LIMITE_POR_JANELA = 5;

const requisicoesPorIp = new Map<string, number[]>();

export function rateLimitLeads(req: Request, res: Response, next: NextFunction) {
  const ip = req.ip ?? "desconhecido";
  const agora = Date.now();

  const historico = (requisicoesPorIp.get(ip) ?? []).filter((timestamp) => agora - timestamp < JANELA_MS);

  if (historico.length >= LIMITE_POR_JANELA) {
    throw new AppError("Muitas tentativas. Aguarde alguns minutos e tente novamente.", 429);
  }

  historico.push(agora);
  requisicoesPorIp.set(ip, historico);

  next();
}
