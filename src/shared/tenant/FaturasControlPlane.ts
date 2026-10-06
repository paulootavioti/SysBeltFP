import { z } from "zod";
import { slugDoHostname, slugDoMapaDeHosts } from "./DiretorioControlPlane";

const faturaSchema = z.object({
  id: z.string().uuid(), competencia: z.string().regex(/^\d{4}-\d{2}$/), vencimento: z.string().datetime(),
  status: z.enum(["RASCUNHO", "ABERTA", "VENCIDA", "PAGA", "CANCELADA", "ESTORNADA"]),
  alunosContados: z.number().int().nonnegative(), alunosPorBloco: z.number().int().nonnegative(),
  blocos: z.number().int().nonnegative(), precoPorBlocoCentavos: z.number().int(),
  valorCentavos: z.number().int(), pagaEm: z.string().datetime().nullable(),
  detalhamentoUnidades: z.array(z.object({
    unidadeId: z.string(), nomeUnidade: z.string(), alunosContados: z.number().int(),
    alunosPorBloco: z.number().int(), blocos: z.number().int(),
    precoPorBlocoCentavos: z.number().int(), valorCentavos: z.number().int(),
  })),
}).strict();

export type FaturaControlPlane = z.infer<typeof faturaSchema>;

export async function listarFaturasControlPlane(hostname: string, fetchFn: typeof fetch = fetch): Promise<FaturaControlPlane[] | null> {
  if (process.env.CONTROL_PLANE_DIRECTORY_MULTIPRODUCT_ENABLED !== "true") return null;
  const slug = slugDoMapaDeHosts(hostname, process.env.SYSBELT_TENANT_HOST_MAP || "")
    ?? slugDoHostname(hostname, (process.env.SYSBELT_TENANT_DOMAINS || "").split(","));
  if (!slug) throw new Error("TENANT_NAO_IDENTIFICADO");
  const baseUrl = process.env.CONTROL_PLANE_URL?.trim();
  const credencial = process.env.CONTROL_PLANE_SYSBELT_CREDENTIAL?.trim();
  const versao = process.env.CONTROL_PLANE_CREDENTIAL_VERSION?.trim() || "v1";
  if (!baseUrl || !credencial) throw new Error("CONTROL_PLANE_NAO_CONFIGURADO");
  const resposta = await fetchFn(new URL(`/api/diretorio/v1/produtos/sysbelt/tenants/${encodeURIComponent(slug)}/faturas`, baseUrl), {
    headers: { authorization: `Bearer ${credencial}`, "x-control-plane-credential-version": versao, accept: "application/json" },
    signal: AbortSignal.timeout(3_000),
  });
  if (!resposta.ok) throw new Error(`CONTROL_PLANE_FATURAS_HTTP_${resposta.status}`);
  return z.array(faturaSchema).parse(await resposta.json());
}
