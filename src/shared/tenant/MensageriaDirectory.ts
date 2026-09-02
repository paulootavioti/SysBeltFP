import { z } from "zod";

const contaSchema = z.object({
  tenantKey: z.string().uuid(), slug: z.string().min(1), status: z.enum(["ATIVO", "SUSPENSO"]),
  appSecretRef: z.string().min(1),
}).strict();

export type ContaMensageriaResolvida = z.infer<typeof contaSchema>;
export type TipoCanalExterno = "WHATSAPP" | "INSTAGRAM";

export class MensageriaDirectoryHttp {
  constructor(private readonly urlBase: string, private readonly segredo: string, private readonly fetchFn: typeof fetch = fetch) {
    if (segredo.length < 32) throw new Error("TENANT_DIRECTORY_SECRET precisa ter pelo menos 32 caracteres.");
  }

  async resolver(tipo: TipoCanalExterno, identificador: string): Promise<ContaMensageriaResolvida | null> {
    try {
      const url = new URL(`/api/diretorio/v1/tenants/mensageria/${tipo}/${encodeURIComponent(identificador)}`, this.urlBase);
      const resposta = await this.fetchFn(url, {
        headers: { "x-sysbelt-directory-secret": this.segredo, accept: "application/json" },
        signal: AbortSignal.timeout(2_000),
      });
      if (resposta.status === 404) return null;
      if (!resposta.ok) throw new Error("diretório indisponível");
      return contaSchema.parse(await resposta.json());
    } catch (erro) {
      if (erro instanceof z.ZodError) throw new Error("DIRETORIO_MENSAGERIA_INDISPONIVEL");
      if (erro instanceof Error && erro.message === "diretório indisponível") throw new Error("DIRETORIO_MENSAGERIA_INDISPONIVEL");
      throw new Error("DIRETORIO_MENSAGERIA_INDISPONIVEL");
    }
  }
}
