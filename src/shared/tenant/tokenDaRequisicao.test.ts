import { afterEach, describe, expect, it } from "vitest";
import { decode } from "jsonwebtoken";
import { comContextoTenant } from "./ContextoTenant";
import { assinarTokenDaRequisicao, verificarTokenDaRequisicao } from "./tokenDaRequisicao";

const segredo = "segredo-de-teste-com-mais-de-trinta-e-dois-caracteres";
const tenantA = "64d729dc-8cbc-4fbf-9259-f28809faf55d";
const tenantB = "e7615244-09ac-4957-bf14-65fd15cfbeae";
const env = { JWT_SECRET: segredo, TENANT_RESOLUTION_ENABLED: "true" };

function noTenant<T>(tenantKey: string, acao: () => T): T {
  return comContextoTenant({ tenantKey, slug: "academia", prisma: {} as never, requestId: "req", schemaVersion: "1" }, acao);
}

afterEach(() => { delete process.env.TENANT_RESOLUTION_ENABLED; });

describe("token da requisição", () => {
  it("assina e valida no mesmo contexto tenant quando habilitado", () => {
    const token = noTenant(tenantA, () => assinarTokenDaRequisicao(
      { perfil: "ADMIN" }, { subject: "1", expiresIn: "5m" }, "sysbelt-web", env,
    ));
    expect(noTenant(tenantA, () => verificarTokenDaRequisicao(token, "sysbelt-web", env)))
      .toMatchObject({ sub: "1", tenantKey: tenantA, perfil: "ADMIN" });
    expect(() => noTenant(tenantB, () => verificarTokenDaRequisicao(token, "sysbelt-web", env))).toThrow();
  });

  it("recusa audiência de outro portal", () => {
    const token = noTenant(tenantA, () => assinarTokenDaRequisicao({}, { subject: "1", expiresIn: "5m" }, "sysbelt-web", env));
    expect(() => noTenant(tenantA, () => verificarTokenDaRequisicao(token, "sysbelt-familia", env))).toThrow();
  });

  it("mantém token legado somente enquanto a resolução está desligada", () => {
    const legado = { JWT_SECRET: segredo };
    const token = assinarTokenDaRequisicao({}, { subject: "1", expiresIn: "5m" }, "sysbelt-web", legado);
    expect(decode(token)).not.toHaveProperty("tenantKey");
    expect(verificarTokenDaRequisicao(token, "sysbelt-web", legado)).toMatchObject({ sub: "1" });
  });
});
