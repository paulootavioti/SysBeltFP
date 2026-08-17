import { api } from "../services/api";

// O backend guarda a foto como caminho relativo a ELE ("/uploads/treinos/x.png").
// Usar esse caminho cru num <img> resolveria contra o domínio do frontend, que
// não serve /uploads. Por isso prefixamos com a base da API (a mesma do axios).
// A url já vem assinada do backend (?exp=&sig=), então o <img> carrega sem
// precisar de header de autenticação.
export function resolverUrlUpload(url: string) {
  if (!url || /^(https?:)?\/\//.test(url) || url.startsWith("data:")) {
    return url;
  }

  const base = (api.defaults.baseURL ?? "").replace(/\/$/, "");
  return `${base}${url.startsWith("/") ? "" : "/"}${url}`;
}
