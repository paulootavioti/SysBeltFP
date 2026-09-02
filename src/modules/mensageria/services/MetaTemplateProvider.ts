export interface ComponenteTemplateMeta {
  type?: string;
  format?: string;
  text?: string;
  buttons?: Array<{ type?: string; url?: string }>;
}

export interface TemplateMeta {
  id: string;
  name: string;
  language: string;
  status: string;
  category?: string;
  components: ComponenteTemplateMeta[];
}

export class MetaTemplateProvider {
  constructor(private readonly fetchFn: typeof fetch = fetch, private readonly versao = process.env.META_GRAPH_API_VERSION?.trim() || "v23.0") {}

  async listar(businessAccountId: string, token: string) {
    const templates: TemplateMeta[] = [];
    let after = "";
    for (let pagina = 0; pagina < 10; pagina++) {
      const params = new URLSearchParams({ fields: "id,name,language,status,category,components", limit: "100" });
      if (after) params.set("after", after);
      const resposta = await this.fetchFn(`https://graph.facebook.com/${this.versao}/${encodeURIComponent(businessAccountId)}/message_templates?${params}`, {
        headers: { authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(8_000),
      });
      const payload = await resposta.json() as { data?: TemplateMeta[]; paging?: { cursors?: { after?: string }; next?: string } };
      if (!resposta.ok || !Array.isArray(payload.data)) throw new Error("META_TEMPLATES_INDISPONIVEIS");
      templates.push(...payload.data.filter((item) => item.id && item.name && item.language && item.status));
      const proximo = payload.paging?.next ? payload.paging.cursors?.after : undefined;
      if (!proximo) break;
      after = proximo;
    }
    return templates;
  }
}
