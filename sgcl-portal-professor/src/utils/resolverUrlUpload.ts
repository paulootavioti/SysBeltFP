import { api } from "../services/api";

// O backend guarda a foto como caminho relativo a ELE ("/uploads/treinos/x.png"),
// mas este app roda num domínio Netlify separado — usar o caminho cru num <img>
// resolveria contra o domínio do portal, que não serve /uploads e devolve 404.
// Por isso prefixamos com a base da API (mesma usada pelo axios).
export function resolverUrlUpload(url: string) {
  if (/^(https?:)?\/\//.test(url) || url.startsWith("data:")) {
    return url;
  }

  const base = (api.defaults.baseURL ?? "").replace(/\/$/, "");
  return `${base}${url.startsWith("/") ? "" : "/"}${url}`;
}
