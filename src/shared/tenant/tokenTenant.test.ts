import { describe, expect, it } from "vitest";
import { decode } from "jsonwebtoken";
import { assinarTokenTenant, verificarTokenTenant } from "./tokenTenant";

const segredo = "segredo-de-teste-com-mais-de-trinta-e-dois-caracteres";
const tenantA = "64d729dc-8cbc-4fbf-9259-f28809faf55d";
const tenantB = "e7615244-09ac-4957-bf14-65fd15cfbeae";

describe("tokenTenant", () => {
  it("assina identidade do tenant com emissor e audiência", () => {
    const token = assinarTokenTenant({ perfil: "ADMIN" }, tenantA, segredo, {
      subject: "1", expiresIn: "5m", audience: "sysbelt-web",
    });
    expect(verificarTokenTenant(token, tenantA, segredo, "sysbelt-web")).toMatchObject({
      sub: "1", perfil: "ADMIN", tenantKey: tenantA, iss: "sysbelt-tenant-plane", aud: "sysbelt-web",
    });
  });

  it("recusa token válido de outro tenant", () => {
    const token = assinarTokenTenant({}, tenantA, segredo, { subject: "1", expiresIn: "5m" });
    expect(() => verificarTokenTenant(token, tenantB, segredo)).toThrow("TOKEN_TENANT_INVALIDO");
  });

  it("não permite sobrescrever tenant ou emissor pelos claims", () => {
    const token = assinarTokenTenant({ tenantKey: tenantB, iss: "forjado" }, tenantA, segredo, {
      subject: "1", expiresIn: "5m",
    });
    expect(decode(token)).toMatchObject({ tenantKey: tenantA, iss: "sysbelt-tenant-plane" });
  });
});
