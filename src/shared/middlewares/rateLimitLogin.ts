import { rateLimit } from "express-rate-limit";

const QUINZE_MINUTOS_MS = 15 * 60 * 1000;

function limiteConfigurado(env: NodeJS.ProcessEnv = process.env): number {
  const valor = Number(env.LOGIN_RATE_LIMIT_MAX ?? 10);
  return Number.isInteger(valor) && valor > 0 ? valor : 10;
}

export function criarRateLimitLogin(env: NodeJS.ProcessEnv = process.env) {
  return rateLimit({
    windowMs: QUINZE_MINUTOS_MS,
    limit: limiteConfigurado(env),
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true,
    handler: (_request, response) => response.status(429).json({
      message: "Muitas tentativas de acesso. Aguarde alguns minutos e tente novamente.",
    }),
  });
}

export const rateLimitLogin = criarRateLimitLogin();
