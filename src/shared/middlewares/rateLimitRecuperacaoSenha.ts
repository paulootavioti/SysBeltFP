import { rateLimit } from "express-rate-limit";

export const rateLimitRecuperacaoSenha = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 3,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_request, response) => response.status(429).json({
    message: "Muitas solicitações. Aguarde antes de tentar novamente.",
  }),
});
