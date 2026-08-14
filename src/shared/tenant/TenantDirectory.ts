import { z } from "zod";

const tenantResolvidoSchema = z.object({
  tenantKey: z.string().uuid(),
  slug: z.string().regex(/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/),
  status: z.enum(["ATIVO", "SUSPENSO"]),
  secretRef: z.string().trim().min(1).max(500),
  schemaVersion: z.string().trim().min(1).max(100),
  credentialVersion: z.number().int().positive(),
}).strict();

export type TenantResolvido = z.infer<typeof tenantResolvidoSchema>;
export interface TenantDirectory { resolver(slug: string): Promise<TenantResolvido | null>; }

export class TenantDirectoryIndisponivelError extends Error {
  constructor() { super("TENANT_DIRECTORY_INDISPONIVEL"); }
}

type Fetch = typeof fetch;

export class TenantDirectoryHttp implements TenantDirectory {
  constructor(
    private readonly urlBase: string,
    private readonly segredo: string,
    private readonly fetchFn: Fetch = fetch,
    private readonly timeoutMs = 2_000,
  ) {
    if (segredo.length < 32) throw new Error("TENANT_DIRECTORY_SECRET precisa ter pelo menos 32 caracteres.");
  }

  async resolver(slug: string): Promise<TenantResolvido | null> {
    let resposta: Response;
    try {
      const url = new URL(`/api/diretorio/v1/tenants/${encodeURIComponent(slug)}`, this.urlBase);
      resposta = await this.fetchFn(url, {
        headers: { "x-sysbelt-directory-secret": this.segredo, accept: "application/json" },
        signal: AbortSignal.timeout(this.timeoutMs),
      });
    } catch {
      throw new TenantDirectoryIndisponivelError();
    }
    if (resposta.status === 404) return null;
    if (!resposta.ok) throw new TenantDirectoryIndisponivelError();
    try {
      return tenantResolvidoSchema.parse(await resposta.json());
    } catch {
      throw new TenantDirectoryIndisponivelError();
    }
  }
}

export function criarTenantDirectoryDoAmbiente(env: NodeJS.ProcessEnv = process.env): TenantDirectoryHttp {
  const url = env.CONTROL_PLANE_URL?.trim();
  const segredo = env.TENANT_DIRECTORY_SECRET?.trim();
  if (!url || !segredo) throw new Error("Diretório de tenants não configurado.");
  return new TenantDirectoryHttp(url, segredo);
}
