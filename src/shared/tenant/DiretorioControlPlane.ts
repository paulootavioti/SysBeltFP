import { z } from "zod";

const respostaSchema = z.object({
  schemaVersion: z.string(),
  tenantKey: z.string().uuid(),
  produto: z.literal("sysbelt"),
  slug: z.string().min(1).max(63),
  status: z.enum(["ATIVO", "SUSPENSO_FINANCEIRO", "SUSPENSO_OPERACIONAL"]),
  acesso: z.object({
    administrativo: z.enum(["LIBERADO", "RESTRITO_REGULARIZACAO"]),
    clinico: z.string(),
  }).strict(),
  secretRef: z.string().min(1),
  tenantSchemaVersion: z.string().nullable(),
  credentialVersion: z.number().int().positive(),
}).strict();

export type TenantResolvido = z.infer<typeof respostaSchema>;
type EntradaCache = { expiraEm: number; valor: TenantResolvido | null };

export class DiretorioIndisponivelError extends Error {}

export class DiretorioControlPlane {
  private readonly cache = new Map<string, EntradaCache>();

  constructor(
    private readonly baseUrl: string,
    private readonly credencial: string,
    private readonly versaoCredencial = "v1",
    private readonly fetchFn: typeof fetch = fetch,
    private readonly agora: () => number = Date.now,
  ) {
    if (!baseUrl || !credencial || !versaoCredencial) throw new Error("DIRETORIO_MULTIPRODUTO_NAO_CONFIGURADO");
  }

  async resolver(slug: string): Promise<TenantResolvido | null> {
    const chave = slug.toLowerCase();
    const armazenado = this.cache.get(chave);
    if (armazenado && armazenado.expiraEm > this.agora()) return armazenado.valor;

    let resposta: Response;
    try {
      resposta = await this.fetchFn(new URL(`/api/diretorio/v1/produtos/sysbelt/tenants/${encodeURIComponent(chave)}`, this.baseUrl), {
        headers: { authorization: `Bearer ${this.credencial}`, "x-control-plane-credential-version": this.versaoCredencial, accept: "application/json" },
        signal: AbortSignal.timeout(2_000),
      });
    } catch { throw new DiretorioIndisponivelError("DIRETORIO_INDISPONIVEL"); }

    if (resposta.status === 404) {
      this.cache.set(chave, { valor: null, expiraEm: this.agora() + 5_000 });
      return null;
    }
    if (!resposta.ok) throw new DiretorioIndisponivelError(`DIRETORIO_HTTP_${resposta.status}`);
    let valor: TenantResolvido;
    try { valor = respostaSchema.parse(await resposta.json()); }
    catch { throw new DiretorioIndisponivelError("DIRETORIO_RESPOSTA_INVALIDA"); }
    const ttl = valor.status === "ATIVO" ? 60_000 : 15_000;
    this.cache.set(chave, { valor, expiraEm: this.agora() + ttl });
    return valor;
  }
}

export function slugDoHostname(hostname: string, dominios: string[]): string | null {
  const host = hostname.toLowerCase().replace(/:\d+$/, "").replace(/\.$/, "");
  for (const dominio of dominios.map((item) => item.trim().toLowerCase()).filter(Boolean)) {
    if (host.endsWith(`.${dominio}`)) {
      const slug = host.slice(0, -(dominio.length + 1));
      return /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(slug) ? slug : null;
    }
  }
  return null;
}

const mapaHostsSchema = z.record(
  z.string().min(1),
  z.string().regex(/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/),
);

export function slugDoMapaDeHosts(hostname: string, configuracao: string): string | null {
  if (!configuracao.trim()) return null;
  let mapa: Record<string, string>;
  try { mapa = mapaHostsSchema.parse(JSON.parse(configuracao)); }
  catch { throw new Error("SYSBELT_TENANT_HOST_MAP_INVALIDO"); }
  const host = hostname.toLowerCase().replace(/:\d+$/, "").replace(/\.$/, "");
  const entrada = Object.entries(mapa).find(([chave]) => chave.toLowerCase().replace(/\.$/, "") === host);
  return entrada?.[1] ?? null;
}
