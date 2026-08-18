import { describe, expect, it } from "vitest";

import { resolverUnidadeConsulta } from "./resolverUnidadeConsulta";

// As unidades da conta de quem pergunta. 42 é filial; 99 é de outro assinante.
const DA_CONTA = [1, 42];

describe("resolverUnidadeConsulta", () => {
  it("ADMIN e PROFESSOR usam a unidade informada em unidadeConsultaId", () => {
    expect(resolverUnidadeConsulta("ADMIN", 1, "42", DA_CONTA)).toBe(42);
    expect(resolverUnidadeConsulta("PROFESSOR", 1, "42", DA_CONTA)).toBe(42);
  });

  it("RECEPCAO ignora unidadeConsultaId e mantém a própria unidade", () => {
    expect(resolverUnidadeConsulta("RECEPCAO", 1, "42", DA_CONTA)).toBe(1);
  });

  it("sem unidadeConsultaId, mantém a unidade do usuário", () => {
    expect(resolverUnidadeConsulta("ADMIN", 1, undefined, DA_CONTA)).toBe(1);
  });

  it("ignora valores inválidos (não numéricos, zero ou negativos)", () => {
    expect(resolverUnidadeConsulta("ADMIN", 1, "abc", DA_CONTA)).toBe(1);
    expect(resolverUnidadeConsulta("ADMIN", 1, "0", DA_CONTA)).toBe(1);
    expect(resolverUnidadeConsulta("ADMIN", 1, "-5", DA_CONTA)).toBe(1);
  });

  // Sem esta checagem o parâmetro é um id livre na querystring: bastaria
  // chutar o id da unidade de outra academia pra ler a grade dela.
  it("recusa unidade de outra conta e mantém o escopo de quem pediu", () => {
    expect(resolverUnidadeConsulta("ADMIN", 1, "99", DA_CONTA)).toBe(1);
    expect(resolverUnidadeConsulta("PROFESSOR", 1, "99", DA_CONTA)).toBe(1);
  });

  it("sem alcance nenhum, não concede unidade nenhuma", () => {
    expect(resolverUnidadeConsulta("ADMIN", 1, "42", [])).toBe(1);
  });

  // O DONO não tem unidade fixa (RN-164): a consulta é o caminho dele para
  // olhar uma filial específica, e sem alcance ele volta a "todas as minhas".
  it("DONO consulta filial da própria conta", () => {
    expect(resolverUnidadeConsulta("DONO", null, "42", DA_CONTA)).toBe(42);
    expect(resolverUnidadeConsulta("DONO", null, "99", DA_CONTA)).toBeNull();
  });

  it("não concede consulta ao perfil legado", () => {
    expect(resolverUnidadeConsulta("SUPERADMIN", null, "42", DA_CONTA)).toBeNull();
  });
});
