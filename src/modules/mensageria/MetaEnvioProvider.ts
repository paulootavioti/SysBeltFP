export interface EnvioMeta {
  tipo: "WHATSAPP" | "INSTAGRAM";
  identificadorConta: string;
  contatoExternoId: string;
  texto?: string;
  template?: { nome: string; idioma: string; parametros?: string[] };
  media?: { tipo: "IMAGEM" | "AUDIO" | "VIDEO" | "DOCUMENTO"; url: string; nome?: string; legenda?: string };
  token: string;
}

export class ErroEnvioMeta extends Error {
  constructor(public readonly codigo: string, public readonly transitorio: boolean) { super(codigo); }
}

export class MetaEnvioProvider {
  constructor(private readonly fetchFn: typeof fetch = fetch, private readonly versao = process.env.META_GRAPH_API_VERSION?.trim() || "v23.0") {}

  async enviar(dados: EnvioMeta): Promise<string> {
    const host = dados.tipo === "INSTAGRAM" ? "https://graph.instagram.com" : "https://graph.facebook.com";
    const url = `${host}/${this.versao}/${encodeURIComponent(dados.identificadorConta)}/messages`;
    if (dados.template && dados.tipo !== "WHATSAPP") throw new ErroEnvioMeta("META_TEMPLATE_CANAL_INVALIDO", false);
    if (!dados.texto && !dados.template && !dados.media) throw new ErroEnvioMeta("META_CONTEUDO_INVALIDO", false);
    if (dados.media?.tipo === "DOCUMENTO" && dados.tipo === "INSTAGRAM") throw new ErroEnvioMeta("META_MEDIA_CANAL_INVALIDO", false);
    const tipoMeta = dados.media?.tipo === "IMAGEM" ? "image" : dados.media?.tipo === "DOCUMENTO" ? "document" : dados.media?.tipo.toLowerCase();
    const corpo = dados.tipo === "WHATSAPP"
      ? dados.media
        ? { messaging_product: "whatsapp", to: dados.contatoExternoId, type: tipoMeta, [tipoMeta!]: { link: dados.media.url, ...(dados.media.legenda && tipoMeta !== "audio" ? { caption: dados.media.legenda } : {}), ...(tipoMeta === "document" && dados.media.nome ? { filename: dados.media.nome } : {}) } }
        : dados.template
        ? { messaging_product: "whatsapp", to: dados.contatoExternoId, type: "template", template: { name: dados.template.nome, language: { code: dados.template.idioma }, ...(dados.template.parametros?.length ? { components: [{ type: "body", parameters: dados.template.parametros.map((text) => ({ type: "text", text })) }] } : {}) } }
        : { messaging_product: "whatsapp", recipient_type: "individual", to: dados.contatoExternoId, type: "text", text: { preview_url: false, body: dados.texto } }
      : dados.media
        ? { recipient: { id: dados.contatoExternoId }, message: { attachment: { type: tipoMeta, payload: { url: dados.media.url } } } }
        : { recipient: { id: dados.contatoExternoId }, message: { text: dados.texto } };
    const resposta = await this.fetchFn(url, {
      method: "POST",
      headers: { authorization: `Bearer ${dados.token}`, "content-type": "application/json" },
      body: JSON.stringify(corpo),
      signal: AbortSignal.timeout(8_000),
    });
    if (!resposta.ok) {
      const payload = await resposta.json().catch(() => ({})) as { error?: { code?: number; error_subcode?: number } };
      const codigoMeta = payload.error?.code;
      const codigo = codigoMeta === 131047 ? "META_JANELA_24H_ENCERRADA" : codigoMeta ? `META_CODIGO_${codigoMeta}` : `META_HTTP_${resposta.status}`;
      const transitório = resposta.status === 429 || resposta.status >= 500 || [1, 2, 4, 17, 130429, 131000, 131048].includes(codigoMeta ?? 0);
      throw new ErroEnvioMeta(codigo, transitório);
    }
    const payload = await resposta.json() as { messages?: Array<{ id?: string }>; message_id?: string };
    const id = dados.tipo === "WHATSAPP" ? payload.messages?.[0]?.id : payload.message_id;
    if (!id) throw new Error("META_RESPOSTA_INVALIDA");
    return id;
  }
}
