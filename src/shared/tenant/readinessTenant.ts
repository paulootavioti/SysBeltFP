import { lerConfiguracaoResolucaoTenant } from "./infraTenant";

export interface ReadinessTenant {
  httpStatus: 200 | 503;
  corpo: {
    service: "tenant-resolution";
    status: "legacy" | "ready" | "not_ready";
    habilitada: boolean;
    obrigatoria: boolean;
    configuracaoValida: boolean;
    awsConfigurada: boolean;
    prontaParaAtivar: boolean;
  };
}

export function obterReadinessTenant(env: NodeJS.ProcessEnv = process.env): ReadinessTenant {
  const habilitada = env.TENANT_RESOLUTION_ENABLED === "true";
  const obrigatoria = env.TENANT_RESOLUTION_REQUIRED === "true";
  let configuracaoValida = false;
  try { lerConfiguracaoResolucaoTenant(env); configuracaoValida = true; } catch { /* indicador sanitizado */ }
  const awsConfigurada = Boolean(env.AWS_REGION?.trim());
  const prontaParaAtivar = configuracaoValida && awsConfigurada;
  const inconsistente = obrigatoria && !habilitada;
  const indisponivel = inconsistente || (habilitada && !prontaParaAtivar);
  return {
    httpStatus: indisponivel ? 503 : 200,
    corpo: {
      service: "tenant-resolution",
      status: indisponivel ? "not_ready" : habilitada ? "ready" : "legacy",
      habilitada, obrigatoria, configuracaoValida, awsConfigurada, prontaParaAtivar,
    },
  };
}
