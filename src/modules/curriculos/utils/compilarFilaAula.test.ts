import { describe, expect, it } from "vitest";
import { calcularDuracaoTurmaMinutos, compilarFilaAula } from "./compilarFilaAula";

describe("compilarFilaAula", () => {
  it("ordena blocos e calcula sparring com descansos apenas entre rounds", () => {
    const fila = compilarFilaAula({
      jogosSugeridos: null,
      tecnicas: [{ id: 8, nome: "Raspagem", ordem: 20, obrigatoria: true, duracaoPrevistaSegundos: 720 }],
      blocos: [
        { id: 1, tipo: "AQUECIMENTO", nome: "Aquecimento", ordem: 0, duracaoPrevistaSegundos: 480 },
        {
          id: 2,
          tipo: "SPARRING",
          nome: "Sparring",
          ordem: 30,
          duracaoPrevistaSegundos: 240,
          rounds: 4,
          duracaoRoundSegundos: 240,
          descansoSegundos: 60,
        },
      ],
    });

    expect(fila.blocos.map((bloco) => bloco.nome)).toEqual(["Aquecimento", "Raspagem", "Sparring"]);
    expect(fila.blocos[2].duracaoPrevistaSegundos).toBe(1140);
    expect(fila.duracaoTotalSegundos).toBe(2340);
  });

  it("mantém jogos legados utilizáveis enquanto não há jogo estruturado", () => {
    const fila = compilarFilaAula({ jogosSugeridos: "Pega-pega, Guarda", tecnicas: [] });
    expect(fila.blocos).toHaveLength(2);
    expect(fila.duracaoTotalSegundos).toBe(720);
  });

  it("calcula a duração da turma, inclusive quando termina após meia-noite", () => {
    expect(calcularDuracaoTurmaMinutos("18:30", "19:30")).toBe(60);
    expect(calcularDuracaoTurmaMinutos("23:30", "00:15")).toBe(45);
  });
});
