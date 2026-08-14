import { sign, verify, type JwtPayload, type SignOptions } from "jsonwebtoken";

const ISSUER = "sysbelt-tenant-plane";

export class TokenTenantInvalidoError extends Error {
  constructor() { super("TOKEN_TENANT_INVALIDO"); }
}

export function assinarTokenTenant(
  claims: Record<string, unknown>,
  tenantKey: string,
  segredo: string,
  opcoes: Pick<SignOptions, "subject" | "expiresIn" | "audience">,
): string {
  if (!tenantKey || segredo.length < 32) throw new TokenTenantInvalidoError();
  const { tenantKey: _ignorado, iss: _issuerIgnorado, ...claimsSeguros } = claims;
  return sign({ ...claimsSeguros, tenantKey }, segredo, { ...opcoes, issuer: ISSUER });
}

export function verificarTokenTenant<T extends JwtPayload>(
  token: string,
  tenantKeyEsperado: string,
  segredo: string,
  audience?: string,
): T & { tenantKey: string } {
  try {
    const payload = verify(token, segredo, { issuer: ISSUER, ...(audience && { audience }) });
    if (typeof payload === "string" || payload.tenantKey !== tenantKeyEsperado) {
      throw new TokenTenantInvalidoError();
    }
    return payload as T & { tenantKey: string };
  } catch {
    throw new TokenTenantInvalidoError();
  }
}
