import { describe, expect, it } from "vitest";

import { duracaoDoBlocoEmSegundos, duracaoTotalBlocosEmSegundos } from "./duracaoBlocos";

const comum = { tipo: "TECNICA" as const, nome: "Base", duracaoMinutos: "5" };
const sparring = { tipo: "SPARRING" as const, nome: "Rounds", duracaoMinutos: "5", rounds: "3", duracaoRoundMinutos: "2", descansoSegundos: "30" };

describe("duração dos blocos", () => {
  it("calcula um bloco comum em minutos", () => expect(duracaoDoBlocoEmSegundos(comum)).toBe(300));
  it("calcula sparring com um round sem descanso", () => expect(duracaoDoBlocoEmSegundos({ ...sparring, rounds: "1" })).toBe(120));
  it("calcula sparring com rounds e descansos", () => expect(duracaoDoBlocoEmSegundos(sparring)).toBe(420));
  it("retorna zero para uma lista vazia", () => expect(duracaoTotalBlocosEmSegundos([])).toBe(0));
  it("soma usando a mesma regra do compilador", () => expect(duracaoTotalBlocosEmSegundos([comum, sparring])).toBe(720));
});
