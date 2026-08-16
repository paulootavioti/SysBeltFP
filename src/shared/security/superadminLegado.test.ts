import { describe, expect, it } from "vitest";

import {
  garantirAcessoSuperadminLegado,
  garantirConcessaoSuperadminPermitida,
  superadminLegadoPodeAcessar,
} from "./superadminLegado";

describe("acesso do SUPERADMIN legado", () => {
  it("bloqueia o operador legado por padrão sem afetar perfis da academia", () => {
    expect(superadminLegadoPodeAcessar("SUPERADMIN", {})).toBe(false);
    expect(superadminLegadoPodeAcessar("DONO", {})).toBe(true);
    expect(superadminLegadoPodeAcessar("ADMIN", {})).toBe(true);
    expect(() => garantirAcessoSuperadminLegado("SUPERADMIN", {})).toThrow("Control Plane");
  });

  it("aceita o operador legado apenas durante rollback explícito", () => {
    const env = { LEGACY_SUPERADMIN_ACCESS_ENABLED: "true" };
    expect(superadminLegadoPodeAcessar("SUPERADMIN", env)).toBe(true);
    expect(() => garantirAcessoSuperadminLegado("SUPERADMIN", env)).not.toThrow();
  });
});

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
