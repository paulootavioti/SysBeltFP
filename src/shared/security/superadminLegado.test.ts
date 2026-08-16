import { describe, expect, it } from "vitest";

import { garantirConcessaoSuperadminPermitida } from "./superadminLegado";

describe("concessão do SUPERADMIN legado", () => {
  it("bloqueia por padrão até quando o ator ainda é SUPERADMIN", () => {
    expect(() =>
      garantirConcessaoSuperadminPermitida("SUPERADMIN", "SUPERADMIN", {}),
    ).toThrow("desativada no Tenant Plane");
  });

  it("mantém rollback explícito somente para um SUPERADMIN existente", () => {
    const env = { LEGACY_SUPERADMIN_MANAGEMENT_ENABLED: "true" };

    expect(() =>
      garantirConcessaoSuperadminPermitida("SUPERADMIN", "ADMIN", env),
    ).toThrow("Apenas um superadmin");
    expect(() =>
      garantirConcessaoSuperadminPermitida("SUPERADMIN", "SUPERADMIN", env),
    ).not.toThrow();
  });

  it("não interfere nos perfis operacionais da academia", () => {
    for (const perfil of ["DONO", "ADMIN", "PROFESSOR", "RECEPCAO"]) {
      expect(() =>
        garantirConcessaoSuperadminPermitida(perfil, "ADMIN", {}),
      ).not.toThrow();
    }
  });
});
