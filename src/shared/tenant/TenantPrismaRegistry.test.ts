import { describe, expect, it, vi } from "vitest";
import { TenantPrismaRegistry } from "./TenantPrismaRegistry";

function cliente() { return { $disconnect: vi.fn().mockResolvedValue(undefined) }; }

describe("TenantPrismaRegistry", () => {
  it("reutiliza por tenant e impede criação duplicada concorrente", async () => {
    const criado = cliente();
    const fabrica = vi.fn().mockReturnValue(criado);
    const carregar = vi.fn().mockResolvedValue("postgresql://segredo");
    const registro = new TenantPrismaRegistry(2, 10_000, fabrica as never, () => 1);
    const identidade = { tenantKey: "tenant-a", credentialVersion: 1 };
    const [a, b] = await Promise.all([registro.obter(identidade, carregar), registro.obter(identidade, carregar)]);
    expect(a).toBe(b);
    expect(fabrica).toHaveBeenCalledOnce();
    expect(carregar).toHaveBeenCalledOnce();
  });

  it("desconecta e recria após rotação da credencial", async () => {
    const antigo = cliente(); const novo = cliente();
    const fabrica = vi.fn().mockReturnValueOnce(antigo).mockReturnValueOnce(novo);
    const registro = new TenantPrismaRegistry(2, 10_000, fabrica as never, () => 1);
    await registro.obter({ tenantKey: "tenant-a", credentialVersion: 1 }, async () => "postgresql://v1");
    const resultado = await registro.obter({ tenantKey: "tenant-a", credentialVersion: 2 }, async () => "postgresql://v2");
    expect(antigo.$disconnect).toHaveBeenCalledOnce();
    expect(resultado).toBe(novo);
  });

  it("aplica limite LRU e expiração por ociosidade", async () => {
    let instante = 0;
    const a = cliente(); const b = cliente(); const c = cliente(); const d = cliente();
    const fila = [a, b, c, d];
    const registro = new TenantPrismaRegistry(2, 100, vi.fn().mockImplementation(() => fila.shift()) as never, () => instante);
    await registro.obter({ tenantKey: "a", credentialVersion: 1 }, async () => "postgresql://a");
    instante = 10;
    await registro.obter({ tenantKey: "b", credentialVersion: 1 }, async () => "postgresql://b");
    instante = 20;
    await registro.obter({ tenantKey: "c", credentialVersion: 1 }, async () => "postgresql://c");
    expect(a.$disconnect).toHaveBeenCalledOnce();
    instante = 200;
    await registro.obter({ tenantKey: "d", credentialVersion: 1 }, async () => "postgresql://d");
    expect(b.$disconnect).toHaveBeenCalledOnce();
    expect(c.$disconnect).toHaveBeenCalledOnce();
  });
});
