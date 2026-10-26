import type { Breadcrumb, ErrorEvent } from "@sentry/react";

// Erros do navegador no Sentry. Só liga com VITE_SENTRY_DSN no build, e o
// SDK é carregado sob demanda: sem a variável, nada dele entra no bundle
// que o usuário baixa.

/** Tira a query string: links como /redefinir-senha?token=… não podem sair do navegador. */
export function semQueryString(url: string | undefined): string | undefined {
  return url?.split("?")[0];
}

export function sanitizarEvento(evento: ErrorEvent): ErrorEvent {
  if (evento.request) {
    evento.request.url = semQueryString(evento.request.url);
    delete evento.request.query_string;
    delete evento.request.cookies;
    delete evento.request.headers;
  }
  delete evento.user;
  return evento;
}

export function sanitizarBreadcrumb(breadcrumb: Breadcrumb): Breadcrumb {
  const dados = breadcrumb.data;
  if (dados) {
    for (const chave of ["url", "from", "to"]) {
      if (typeof dados[chave] === "string") dados[chave] = semQueryString(dados[chave]);
    }
  }
  return breadcrumb;
}

export function iniciarMonitoramento(dsn: string | undefined = import.meta.env.VITE_SENTRY_DSN): void {
  if (!dsn) return;
  void import("@sentry/react").then((Sentry) =>
    Sentry.init({
      dsn,
      release: import.meta.env.VITE_COMMIT_SHA,
      environment: import.meta.env.MODE,
      beforeSend: sanitizarEvento,
      beforeBreadcrumb: sanitizarBreadcrumb,
    }),
  );
}
