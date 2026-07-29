import { describe, expect, it } from "vitest";
import { substituirVariaveisContrato, montarEndereco } from "./variaveisContrato";

describe("substituirVariaveisContrato", () => {
  it("substitui todas as variáveis conhecidas", () => {
    const resultado = substituirVariaveisContrato(
      "Aluno: {{nomeAluno}}. Contratante: {{nomeContratante}}. Unidade: {{unidade}}. Valor: {{valor}}. Data: {{data}}.",
      {
        nomeAluno: "João",
        nomeContratante: "Maria",
        unidade: "Unidade Centro",
        valor: 199.9,
        data: new Date("2026-01-15"),
      }
    );

    expect(resultado).toContain("Aluno: João");
    expect(resultado).toContain("Contratante: Maria");
    expect(resultado).toContain("Unidade: Unidade Centro");
    expect(resultado).toContain("Valor: R$");
    expect(resultado).toContain("15/01/2026");
  });

  it("preenche 'Não informado' pra variáveis conhecidas sem valor", () => {
    const resultado = substituirVariaveisContrato("Responsável: {{nomeResponsavel}}.", {
      nomeAluno: "João",
      nomeContratante: "João",
      unidade: "Unidade Centro",
      valor: 100,
      data: new Date(),
    });

    expect(resultado).toContain("Responsável: Não informado");
  });

  it("mantém intacto um placeholder desconhecido", () => {
    const resultado = substituirVariaveisContrato("{{variavelInexistente}}", {
      nomeAluno: "João",
      nomeContratante: "João",
      unidade: "Unidade Centro",
      valor: 100,
      data: new Date(),
    });

    expect(resultado).toBe("{{variavelInexistente}}");
  });
});

describe("montarEndereco", () => {
  it("monta o endereço a partir das partes disponíveis", () => {
    const endereco = montarEndereco({
      logradouro: "Rua das Flores",
      numero: "123",
      bairro: "Centro",
      cidade: "São Paulo",
      uf: "SP",
    });

    expect(endereco).toBe("Rua das Flores, 123 - Centro - São Paulo/SP");
  });

  it("retorna null quando não há nenhuma parte", () => {
    expect(montarEndereco({})).toBeNull();
  });
});
