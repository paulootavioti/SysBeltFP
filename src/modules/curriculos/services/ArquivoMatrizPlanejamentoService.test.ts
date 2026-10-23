import { describe, expect, it } from "vitest";

import { gerarArquivoMatriz } from "./ArquivoMatrizPlanejamentoService";

describe("arquivo da matriz de planejamentos", () => {
  it("gera PDF com currículos, módulos e aulas", () => {
    const pdf = String(gerarArquivoMatriz({
      matriz: {
        nome: "Matriz Central",
        curriculos: [{ nome: "Kids", modalidadeNome: null, publico: "INFANTIL", modulos: [{ nome: "Base", aulas: [{ titulo: "Quedas", duracaoMinutos: 45 }, { titulo: "Postura" }] }] }],
      },
    }, "pdf"));

    expect(pdf.startsWith("%PDF")).toBe(true);
    for (const trecho of ["Matriz Central", "Kids", "Sem modalidade | INFANTIL", "Modulo: Base", "- Quedas \\(45 min\\)", "- Postura"]) {
      expect(pdf).toContain(trecho);
    }
  });

  it("gera PDF mesmo com a matriz incompleta", () => {
    const pdf = String(gerarArquivoMatriz({ matriz: { curriculos: "inválido" } }, "pdf"));
    expect(pdf).toContain("Matriz de planejamentos");
  });
});
