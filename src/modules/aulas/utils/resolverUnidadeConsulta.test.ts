import { describe, expect, it } from "vitest";

import { resolverUnidadeConsulta } from "./resolverUnidadeConsulta";

describe("resolverUnidadeConsulta", () => {
  it("ADMIN e PROFESSOR usam a unidade informada em unidadeConsultaId", () => {
    expect(resolverUnidadeConsulta("ADMIN", 1, "42")).toBe(42);
    expect(resolverUnidadeConsulta("PROFESSOR", 1, "42")).toBe(42);
  });

  it("RECEPCAO ignora unidadeConsultaId e mantém a própria unidade", () => {
    expect(resolverUnidadeConsulta("RECEPCAO", 1, "42")).toBe(1);
  });

  it("sem unidadeConsultaId, mantém a unidade do usuário", () => {
    expect(resolverUnidadeConsulta("ADMIN", 1, undefined)).toBe(1);
  });

  it("ignora valores inválidos (não numéricos, zero ou negativos)", () => {
    expect(resolverUnidadeConsulta("ADMIN", 1, "abc")).toBe(1);
    expect(resolverUnidadeConsulta("ADMIN", 1, "0")).toBe(1);
    expect(resolverUnidadeConsulta("ADMIN", 1, "-5")).toBe(1);
  });

  it("não concede consulta global ao perfil legado", () => {
    expect(resolverUnidadeConsulta("SUPERADMIN", null, "7")).toBeNull();
  });
});
