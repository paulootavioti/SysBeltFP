import type { PrismaClient } from "@prisma/client";

import { prismaDaRequisicao } from "../database/prismaDaRequisicao";
import { versaoDaApi } from "../versao/versaoDaApi";

// /health responde se a function está de pé (sem tocar no banco), e
// /health/ready, se ela consegue atender: é o endereço que o monitor de
// disponibilidade externo consulta (docs/observabilidade.md).

const TIMEOUT_BANCO_MS = 3_000;

export async function verificarProntidao(
  db: Pick<PrismaClient, "$queryRaw"> = prismaDaRequisicao(),
  timeoutMs = TIMEOUT_BANCO_MS,
): Promise<{ pronto: boolean; banco: "ok" | "indisponivel"; latenciaBancoMs: number; versao: string }> {
  const inicio = performance.now();
  let limite: NodeJS.Timeout | undefined;
  const banco = await Promise.race([
    db.$queryRaw`SELECT 1`.then(() => "ok" as const),
    new Promise<"indisponivel">((resolver) => {
      limite = setTimeout(() => resolver("indisponivel"), timeoutMs);
    }),
  ])
    .catch(() => "indisponivel" as const)
    .finally(() => clearTimeout(limite));
  return {
    pronto: banco === "ok",
    banco,
    latenciaBancoMs: Math.round(performance.now() - inicio),
    versao: versaoDaApi().sha,
  };
}
