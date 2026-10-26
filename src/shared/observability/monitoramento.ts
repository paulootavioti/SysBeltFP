// Envio de erros e alertas para o Sentry. O log da Netlify Function guarda
// pouco tempo e não avisa ninguém; o Sentry agrupa, guarda e dispara os
// alertas configurados em docs/observabilidade.md.
//
// Desligado sem SENTRY_DSN: em desenvolvimento, nos testes e em qualquer
// ambiente sem a variável, tudo aqui é no-op.
//
// Sem instrumentação automática: a do Sentry precisa carregar antes do
// Express, o que não acontece no bundle do esbuild da function. Quem envia
// é o próprio código, pelo logger (ver logger.ts).
import * as Sentry from "@sentry/node";

import { sanitizarTextoParaLog } from "../security/sanitizarErro";
import { versaoDaApi } from "../versao/versaoDaApi";

let ativo = false;

export function iniciarMonitoramento(env: NodeJS.ProcessEnv = process.env): boolean {
  if (ativo || !env.SENTRY_DSN) return ativo;
  Sentry.init({
    dsn: env.SENTRY_DSN,
    environment: env.CONTEXT ?? env.NODE_ENV ?? "desconhecido",
    release: versaoDaApi().sha,
    defaultIntegrations: false,
    enableOpenTelemetrySetup: false,
    enableRuntimeChannelInjection: false,
    tracesSampleRate: 0,
    beforeSend: sanitizarEvento,
  });
  ativo = true;
  return ativo;
}

/** Remove de mensagens e exceções o que o log também não pode ter (tokens, connection strings). */
export function sanitizarEvento<T extends Sentry.ErrorEvent>(evento: T): T {
  if (evento.message) evento.message = sanitizarTextoParaLog(evento.message);
  for (const excecao of evento.exception?.values ?? []) {
    if (excecao.value) excecao.value = sanitizarTextoParaLog(excecao.value);
  }
  delete evento.request;
  delete evento.user;
  return evento;
}

export function reportarErro(evento: string, erro: unknown, dados: Record<string, unknown> = {}) {
  if (!iniciarMonitoramento()) return;
  Sentry.withScope((escopo) => {
    escopo.setTag("evento", evento);
    escopo.setContext("dados", dados);
    Sentry.captureException(erro instanceof Error ? erro : new Error(`${evento}: ${String(erro)}`));
  });
}

export function reportarAlerta(evento: string, dados: Record<string, unknown> = {}) {
  if (!iniciarMonitoramento()) return;
  Sentry.withScope((escopo) => {
    escopo.setTag("evento", evento);
    escopo.setContext("dados", dados);
    Sentry.captureMessage(evento, "warning");
  });
}

/**
 * A function pode ser congelada assim que responde: sem esperar o envio, o
 * evento se perde. Chamado no fim de cada invocação (ver netlify/functions).
 */
export async function descarregarMonitoramento(): Promise<void> {
  if (ativo) await Sentry.flush(2_000);
}
