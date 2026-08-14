import { GetSecretValueCommand, SecretsManagerClient } from "@aws-sdk/client-secrets-manager";
import { z } from "zod";

const segredoSchema = z.object({
  tenantKey: z.string().uuid(),
  pooledUrl: z.string().url().refine((valor) => valor.startsWith("postgresql://") || valor.startsWith("postgres://")),
  credentialVersion: z.number().int().positive(),
}).passthrough();

export interface ConexaoTenant {
  pooledUrl: string;
  credentialVersion: number;
}

export interface TenantSecretProvider {
  obter(secretRef: string, tenantKey: string, credentialVersion: number): Promise<ConexaoTenant>;
}

export class SegredoTenantIndisponivelError extends Error {
  constructor() { super("SEGREDO_TENANT_INDISPONIVEL"); }
}

type ClienteSegredos = Pick<SecretsManagerClient, "send">;

export class TenantSecretProviderAws implements TenantSecretProvider {
  constructor(private readonly cliente: ClienteSegredos = new SecretsManagerClient({})) {}

  async obter(secretRef: string, tenantKey: string, credentialVersion: number): Promise<ConexaoTenant> {
    try {
      const resposta = await this.cliente.send(new GetSecretValueCommand({ SecretId: secretRef }));
      if (!resposta.SecretString) throw new Error("segredo vazio");
      const segredo = segredoSchema.parse(JSON.parse(resposta.SecretString));
      if (segredo.tenantKey !== tenantKey || segredo.credentialVersion !== credentialVersion) {
        throw new Error("identidade ou versão divergente");
      }
      return { pooledUrl: segredo.pooledUrl, credentialVersion: segredo.credentialVersion };
    } catch {
      throw new SegredoTenantIndisponivelError();
    }
  }
}
