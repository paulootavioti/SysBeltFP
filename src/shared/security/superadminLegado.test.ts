import { describe, expect, it } from "vitest";

import {
  garantirAcessoSuperadminLegado,
  superadminLegadoPodeAcessar,
} from "./superadminLegado";

describe("acesso do SUPERADMIN legado", () => {
  it("bloqueia o operador legado por padrão sem afetar perfis da academia", () => {
    expect(superadminLegadoPodeAcessar("SUPERADMIN", {})).toBe(false);
    expect(superadminLegadoPodeAcessar("DONO", {})).toBe(true);
    expect(superadminLegadoPodeAcessar("ADMIN", {})).toBe(true);
    expect(() => garantirAcessoSuperadminLegado("SUPERADMIN", {})).toThrow("Control Plane");
  });

  it("não reabre o Tenant Plane por variável de ambiente", () => {
    const env = { LEGACY_SUPERADMIN_ACCESS_ENABLED: "true" };
    expect(superadminLegadoPodeAcessar("SUPERADMIN", env)).toBe(false);
    expect(() => garantirAcessoSuperadminLegado("SUPERADMIN", env)).toThrow("Control Plane");
  });
});
