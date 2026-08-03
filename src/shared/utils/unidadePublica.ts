import { AppError } from "../errors/AppError";

// A landing page pública é single-tenant: expõe sempre a mesma unidade,
// configurada por env var (sem seletor de tenant nesta rodada — ver
// src/modules/publico). 503 (não 500) porque é um problema de configuração
// do ambiente, não um bug de request.
export function obterUnidadePublicaId(): number {
  const valor = process.env.UNIDADE_PUBLICA_ID;
  const unidadeId = Number(valor);

  if (!valor || Number.isNaN(unidadeId)) {
    throw new AppError("Site público não configurado (UNIDADE_PUBLICA_ID ausente).", 503);
  }

  return unidadeId;
}
