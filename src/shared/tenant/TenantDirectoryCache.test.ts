import { describe, expect, it, vi } from "vitest";
import { TenantDirectoryCache } from "./TenantDirectoryCache";

const tenant = {
  tenantKey: "64d729dc-8cbc-4fbf-9259-f28809faf55d", slug: "academia",
  status: "ATIVO" as const, secretRef: "arn:segredo", schemaVersion: "1", credentialVersion: 1,
};

describe("TenantDirectoryCache", () => {
  it("reutiliza resultado positivo apenas dentro do TTL", async () => {
    let agora = 0;
    const resolver = vi.fn().mockResolvedValue(tenant);
    const cache = new TenantDirectoryCache({ resolver }, 100, 10, 10, () => agora);
    await cache.resolver("academia");
    agora = 99;
    await cache.resolver("academia");
    expect(resolver).toHaveBeenCalledOnce();
    agora = 100;
    await cache.resolver("academia");
    expect(resolver).toHaveBeenCalledTimes(2);
  });

  it("usa TTL menor para tenant ausente e não guarda indisponibilidade", async () => {
    let agora = 0;
    const resolver = vi.fn()
      .mockResolvedValueOnce(null)
      .mockRejectedValueOnce(new Error("indisponível"))
      .mockResolvedValueOnce(tenant);
    const cache = new TenantDirectoryCache({ resolver }, 100, 5, 10, () => agora);
    await expect(cache.resolver("ausente")).resolves.toBeNull();
    agora = 4;
    await expect(cache.resolver("ausente")).resolves.toBeNull();
    expect(resolver).toHaveBeenCalledOnce();
    agora = 5;
    await expect(cache.resolver("ausente")).rejects.toThrow("indisponível");
    await expect(cache.resolver("ausente")).resolves.toEqual(tenant);
    expect(resolver).toHaveBeenCalledTimes(3);
  });

  it("deduplica consultas concorrentes e permite invalidação imediata", async () => {
    const resolver = vi.fn().mockResolvedValue(tenant);
    const cache = new TenantDirectoryCache({ resolver });
    await Promise.all([cache.resolver("academia"), cache.resolver("academia")]);
    expect(resolver).toHaveBeenCalledOnce();
    cache.invalidar("academia");
    await cache.resolver("academia");
    expect(resolver).toHaveBeenCalledTimes(2);
  });
});
