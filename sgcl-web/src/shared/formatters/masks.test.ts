import { describe, expect, it } from "vitest";

import { maskCEP, maskCPF, maskTelefone, somenteNumeros } from "./masks";

describe("somenteNumeros", () => {
  it("remove tudo que não é dígito", () => {
    expect(somenteNumeros("123.456-78 ab")).toBe("12345678");
  });
});

describe("maskCPF", () => {
  it("formata um CPF completo", () => {
    expect(maskCPF("12345678901")).toBe("123.456.789-01");
  });

  it("ignora dígitos além dos 11 primeiros", () => {
    expect(maskCPF("123456789019999")).toBe("123.456.789-01");
  });
});

describe("maskCEP", () => {
  it("formata um CEP completo", () => {
    expect(maskCEP("12345678")).toBe("12345-678");
  });
});

describe("maskTelefone", () => {
  it("formata telefone fixo (10 dígitos)", () => {
    expect(maskTelefone("1123456789")).toBe("(11) 2345-6789");
  });

  it("formata celular (11 dígitos)", () => {
    expect(maskTelefone("11987654321")).toBe("(11) 98765-4321");
  });
});
