import type { NextFunction, Request, Response } from "express";
import { ipKeyGenerator, rateLimit } from "express-rate-limit";
import { normalizarTelefoneBR } from "../../whatsapp/utils/telefone";

const JANELA_MS = 15 * 60 * 1000;
const LIMITE_TELEFONE = 3;
const tentativasTelefone = new Map<string, number[]>();

export const rateLimitCaptacaoPorIp = rateLimit({
  windowMs: JANELA_MS,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => ipKeyGenerator(req.ip ?? "desconhecido"),
  handler: (_req, res) => res.status(429).json({ message: "Não foi possível enviar agora. Tente novamente mais tarde." }),
});

export function rateLimitCaptacaoPorTelefone(req: Request, res: Response, next: NextFunction) {
  const telefone = normalizarTelefoneBR(req.body.telefone);
  if (!telefone) return next();
  const agora = Date.now();
  const tentativas = (tentativasTelefone.get(telefone) ?? []).filter((instante) => agora - instante < JANELA_MS);
  if (tentativas.length >= LIMITE_TELEFONE) {
    return res.status(429).json({ message: "Não foi possível enviar agora. Tente novamente mais tarde." });
  }
  tentativas.push(agora);
  tentativasTelefone.set(telefone, tentativas);
  return next();
}

export function limparRateLimitCaptacaoParaTestes() {
  tentativasTelefone.clear();
}
