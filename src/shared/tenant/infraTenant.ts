import { TenantDirectoryHttp } from "./TenantDirectory";
import { TenantDirectoryCache } from "./TenantDirectoryCache";
import { TenantPrismaRegistry } from "./TenantPrismaRegistry";
import { TenantSecretProviderAws } from "./TenantSecretProvider";
import { criarResolucaoTenantMiddleware, type DependenciasResolucaoTenant } from "./resolucaoTenantMiddleware";

export interface ConfiguracaoResolucaoTenant {
  dominioBase: string;
  controlPlaneUrl: string;
  segredoDiretorio: string;
  ttlDiretorioMs: number;
  ttlNegativoMs: number;
  limiteDiretorio: number;
  limitePrisma: number;
  ociosidadePrismaMs: number;
  versoesSchemaCompativeis: ReadonlySet<string>;
}

function inteiro(env: NodeJS.ProcessEnv, nome: string, padrao: number, minimo: number, maximo: number): number {
  const bruto = env[nome];
  const valor = bruto === undefined ? padrao : Number(bruto);
  if (!Number.isInteger(valor) || valor < minimo || valor > maximo) throw new Error(`${nome} inválida.`);
  return valor;
}

export function lerConfiguracaoResolucaoTenant(env: NodeJS.ProcessEnv = process.env): ConfiguracaoResolucaoTenant {
  const dominioBase = env.TENANT_APP_BASE_DOMAIN?.trim().toLowerCase();
  const controlPlaneUrl = env.CONTROL_PLANE_URL?.trim();
  const segredoDiretorio = env.TENANT_DIRECTORY_SECRET?.trim();
  const versoes = env.TENANT_SCHEMA_COMPATIBLE_VERSIONS?.split(",").map((item) => item.trim()).filter(Boolean) ?? [];
  if (!dominioBase || !controlPlaneUrl || !segredoDiretorio || segredoDiretorio.length < 32 || versoes.length === 0) {
    throw new Error("Resolução de tenant não configurada.");
  }
  const url = new URL(controlPlaneUrl);
  if (env.NODE_ENV === "production" && url.protocol !== "https:") throw new Error("CONTROL_PLANE_URL deve usar HTTPS.");
  return {
    dominioBase,
    controlPlaneUrl: url.toString(),
    segredoDiretorio,
    ttlDiretorioMs: inteiro(env, "TENANT_DIRECTORY_TTL_MS", 30_000, 1_000, 300_000),
    ttlNegativoMs: inteiro(env, "TENANT_DIRECTORY_NEGATIVE_TTL_MS", 5_000, 500, 30_000),
    limiteDiretorio: inteiro(env, "TENANT_DIRECTORY_CACHE_LIMIT", 500, 1, 10_000),
    limitePrisma: inteiro(env, "TENANT_PRISMA_CACHE_LIMIT", 10, 1, 100),
    ociosidadePrismaMs: inteiro(env, "TENANT_PRISMA_IDLE_MS", 300_000, 10_000, 3_600_000),
    versoesSchemaCompativeis: new Set(versoes),
  };
}

export function criarDependenciasResolucaoTenant(
  env: NodeJS.ProcessEnv = process.env,
): DependenciasResolucaoTenant {
  const config = lerConfiguracaoResolucaoTenant(env);
  const diretorioHttp = new TenantDirectoryHttp(config.controlPlaneUrl, config.segredoDiretorio);
  return {
    dominioBase: config.dominioBase,
    desenvolvimento: env.NODE_ENV !== "production",
    diretorio: new TenantDirectoryCache(
      diretorioHttp, config.ttlDiretorioMs, config.ttlNegativoMs, config.limiteDiretorio,
    ),
    segredos: new TenantSecretProviderAws(),
    registro: new TenantPrismaRegistry(config.limitePrisma, config.ociosidadePrismaMs),
    versoesSchemaCompativeis: config.versoesSchemaCompativeis,
  };
}

let middleware: ReturnType<typeof criarResolucaoTenantMiddleware> | undefined;

export function resolucaoTenantMiddleware() {
  middleware ??= criarResolucaoTenantMiddleware(criarDependenciasResolucaoTenant());
  return middleware;
}
