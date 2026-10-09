import { describe, expect, it } from "vitest";
import { jogosDaAula } from "./jogosDaAula";

describe("jogosDaAula", () => {
  it("separa linhas", () => expect(jogosDaAula("Equilíbrio\nCircuito")).toEqual(["Equilíbrio", "Circuito"]));
  it("aceita vírgulas em dados legados", () => expect(jogosDaAula("Equilíbrio, Circuito")).toEqual(["Equilíbrio", "Circuito"]));
  it("aceita mistura e remove duplicados", () => expect(jogosDaAula("Equilíbrio, Circuito\n equilíbrio ")).toEqual(["Equilíbrio", "Circuito"]));
  it("ignora texto vazio", () => expect(jogosDaAula(" \n , ")).toEqual([]));
});
