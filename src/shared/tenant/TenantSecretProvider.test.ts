import { describe, expect, it, vi } from "vitest";
import { TenantSecretProviderAws } from "./TenantSecretProvider";

const tenantKey = "64d729dc-8cbc-4fbf-9259-f28809faf55d";

describe("TenantSecretProviderAws", () => {
  it("retorna somente a conexão pooled da versão esperada", async () => {
    const send = vi.fn().mockResolvedValue({ SecretString: JSON.stringify({
      tenantKey, pooledUrl: "postgresql://usuario:senha@pooler/banco",
      directUrl: "postgresql://usuario:senha@direto/banco", credentialVersion: 4,
      integrationPrivateKey: "privada",
    }) });
    const resultado = await new TenantSecretProviderAws({ send } as never).obter("arn:segredo", tenantKey, 4);
    expect(resultado).toEqual({ pooledUrl: "postgresql://usuario:senha@pooler/banco", credentialVersion: 4 });
    expect(resultado).not.toHaveProperty("directUrl");
    expect(resultado).not.toHaveProperty("integrationPrivateKey");
  });

  it.each([
    { tenantKey: "e7615244-09ac-4957-bf14-65fd15cfbeae", credentialVersion: 4 },
    { tenantKey, credentialVersion: 3 },
  ])("falha fechado para identidade ou versão divergente", async (alteracao) => {
    const send = vi.fn().mockResolvedValue({ SecretString: JSON.stringify({
      ...alteracao, pooledUrl: "postgresql://usuario:senha@pooler/banco",
    }) });
    await expect(new TenantSecretProviderAws({ send } as never).obter("arn:segredo", tenantKey, 4))
      .rejects.toThrow("SEGREDO_TENANT_INDISPONIVEL");
  });

  it("não propaga detalhes do cofre ou connection string em erros", async () => {
    const send = vi.fn().mockRejectedValue(new Error("postgresql://usuario:senha@host/banco"));
    await expect(new TenantSecretProviderAws({ send } as never).obter("arn:segredo", tenantKey, 1))
      .rejects.toThrow(/^SEGREDO_TENANT_INDISPONIVEL$/);
  });
});
