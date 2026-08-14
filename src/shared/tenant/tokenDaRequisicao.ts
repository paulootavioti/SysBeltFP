import { sign, verify, type JwtPayload, type SignOptions } from "jsonwebtoken";
import { tenantKeyDoContexto } from "./ContextoTenant";
import { assinarTokenTenant, verificarTokenTenant } from "./tokenTenant";

function segredoJwt(env: NodeJS.ProcessEnv): string {
  const segredo = env.JWT_SECRET;
  if (!segredo) throw new Error("JWT_SECRET não configurado.");
  return segredo;
}

export function assinarTokenDaRequisicao(
  claims: Record<string, unknown>,
  opcoes: Pick<SignOptions, "subject" | "expiresIn">,
  audience: string,
  env: NodeJS.ProcessEnv = process.env,
): string {
  const segredo = segredoJwt(env);
  if (env.TENANT_RESOLUTION_ENABLED === "true") {
    return assinarTokenTenant(claims, tenantKeyDoContexto(), segredo, { ...opcoes, audience });
  }
  return sign(claims, segredo, opcoes);
}

export function verificarTokenDaRequisicao<T extends object>(
  token: string,
  audience: string,
  env: NodeJS.ProcessEnv = process.env,
): T {
  const segredo = segredoJwt(env);
  if (env.TENANT_RESOLUTION_ENABLED === "true") {
    return verificarTokenTenant<JwtPayload>(token, tenantKeyDoContexto(), segredo, audience) as T;
  }
  return verify(token, segredo) as T;
}
