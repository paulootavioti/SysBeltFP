const HOSTS_META = ["facebook.com", "fbsbx.com", "fbcdn.net", "cdninstagram.com", "instagram.com", "whatsapp.net"];

function validarUrlMeta(valor: string) {
  const url = new URL(valor);
  if (url.protocol !== "https:" || !HOSTS_META.some((host) => url.hostname === host || url.hostname.endsWith(`.${host}`))) throw new Error("META_MEDIA_URL_INVALIDA");
  return url.toString();
}

export class MetaMediaProvider {
  constructor(private readonly fetchFn: typeof fetch = fetch, private readonly versao = process.env.META_GRAPH_API_VERSION?.trim() || "v23.0") {}

  async obterWhatsApp(mediaId: string, token: string) {
    const resposta = await this.fetchFn(`https://graph.facebook.com/${this.versao}/${encodeURIComponent(mediaId)}`, { headers: { authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(8_000) });
    const payload = await resposta.json() as { url?: string; mime_type?: string; file_size?: number };
    if (!resposta.ok || !payload.url) throw new Error("META_MEDIA_INDISPONIVEL");
    return { url: validarUrlMeta(payload.url), mime: payload.mime_type, tamanho: payload.file_size };
  }

  async baixar(url: string, token?: string) {
    const resposta = await this.fetchFn(validarUrlMeta(url), { headers: token ? { authorization: `Bearer ${token}` } : undefined, signal: AbortSignal.timeout(15_000) });
    if (!resposta.ok) throw new Error("META_MEDIA_DOWNLOAD_FALHOU");
    return { buffer: Buffer.from(await resposta.arrayBuffer()), mime: resposta.headers.get("content-type")?.split(";")[0]?.trim(), tamanho: Number(resposta.headers.get("content-length")) || undefined };
  }
}
