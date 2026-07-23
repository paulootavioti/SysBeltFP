import { describe, expect, it } from "vitest";

import { calcularSemana } from "./semana";

describe("calcularSemana", () => {
  it("calcula a semana a partir de uma quarta-feira", () => {
    const quarta = new Date("2026-07-22T15:00:00");
    const { inicio, fim } = calcularSemana(quarta);

    expect(inicio.getDay()).toBe(1);
    expect(inicio.toDateString()).toBe(new Date("2026-07-20T00:00:00").toDateString());

    expect(fim.getDay()).toBe(0);
    expect(fim.toDateString()).toBe(new Date("2026-07-26T00:00:00").toDateString());
  });

  it("calcula a semana a partir de uma segunda-feira (limite inferior)", () => {
    const segunda = new Date("2026-07-20T08:00:00");
    const { inicio } = calcularSemana(segunda);

    expect(inicio.toDateString()).toBe(segunda.toDateString());
  });

  it("calcula a semana a partir de um domingo (vira semana anterior)", () => {
    const domingo = new Date("2026-07-26T20:00:00");
    const { inicio, fim } = calcularSemana(domingo);

    expect(inicio.toDateString()).toBe(new Date("2026-07-20T00:00:00").toDateString());
    expect(fim.toDateString()).toBe(domingo.toDateString());
  });

  it("inicio começa à meia-noite e fim termina no último milissegundo do dia", () => {
    const { inicio, fim } = calcularSemana(new Date("2026-07-22T15:00:00"));

    expect(inicio.getHours()).toBe(0);
    expect(inicio.getMinutes()).toBe(0);

    expect(fim.getHours()).toBe(23);
    expect(fim.getMinutes()).toBe(59);
  });
});
