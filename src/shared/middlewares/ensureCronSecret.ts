import { Request, Response, NextFunction } from "express";
import { AppError } from "../errors/AppError";

// Autenticação por segredo compartilhado — pra endpoints chamados por um
// disparador externo (Netlify Scheduled Function, GitHub Action cron),
// sem JWT de usuário. Falha fechado: se CRON_SECRET não estiver
// configurado no ambiente, o endpoint fica bloqueado (nunca aberto por
// omissão de configuração).
export function ensureCronSecret(req: Request, res: Response, next: NextFunction) {
  const segredoConfigurado = process.env.CRON_SECRET;

  if (!segredoConfigurado) {
    throw new AppError("Endpoint não configurado.", 503);
  }

  const segredoRecebido = req.headers["x-cron-secret"];

  if (segredoRecebido !== segredoConfigurado) {
    throw new AppError("Não autorizado.", 401);
  }

  next();
}
