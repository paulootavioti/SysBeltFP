const SLUG = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/;
const RESERVADOS = new Set(["www", "api", "admin", "app", "status", "support", "control"]);

export class HostTenantInvalidoError extends Error {
  constructor() { super("HOST_TENANT_INVALIDO"); }
}

function dominioNormalizado(dominio: string): string {
  const valor = dominio.trim().toLowerCase().replace(/^\.+|\.+$/g, "");
  if (!valor || valor.includes(":")) throw new HostTenantInvalidoError();
  return valor;
}

export function extrairSlugTenant(
  hostRecebido: string | undefined,
  opcoes: { dominioBase: string; desenvolvimento?: boolean },
): string {
  if (!hostRecebido) throw new HostTenantInvalidoError();
  let host = hostRecebido.trim().toLowerCase();
  if (opcoes.desenvolvimento) host = host.replace(/:\d+$/, "");
  if (!host || host.includes(":") || host.endsWith(".")) throw new HostTenantInvalidoError();

  const dominio = dominioNormalizado(opcoes.dominioBase);
  const sufixo = `.${dominio}`;
  if (!host.endsWith(sufixo)) throw new HostTenantInvalidoError();
  const slug = host.slice(0, -sufixo.length);
  if (!SLUG.test(slug) || RESERVADOS.has(slug)) throw new HostTenantInvalidoError();
  return slug;
}
