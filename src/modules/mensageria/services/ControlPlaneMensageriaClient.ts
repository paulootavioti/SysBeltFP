export interface RegistroMensageriaDiretorio {
  tenantKey: string;
  tipo: "WHATSAPP" | "INSTAGRAM";
  identificadorExterno: string;
  appSecretRef: string;
  ativo: boolean;
}

export class ControlPlaneMensageriaClient {
  constructor(
    private readonly urlBase = process.env.CONTROL_PLANE_URL?.trim() || "",
    private readonly segredo = process.env.TENANT_DIRECTORY_SECRET?.trim() || "",
    private readonly fetchFn: typeof fetch = fetch,
  ) {}

  async sincronizar(dados: RegistroMensageriaDiretorio) {
    if (!this.urlBase || this.segredo.length < 32) throw new Error("DIRETORIO_MENSAGERIA_NAO_CONFIGURADO");
    const resposta = await this.fetchFn(new URL("/api/diretorio/v1/tenants/mensageria", this.urlBase), {
      method: "PUT",
      headers: { "x-sysbelt-directory-secret": this.segredo, "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify(dados),
      signal: AbortSignal.timeout(5_000),
    });
    if (!resposta.ok) throw new Error(`DIRETORIO_MENSAGERIA_HTTP_${resposta.status}`);
  }
}
