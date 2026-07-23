import { describe, expect, it } from "vitest";

import { calcularRangeContagem } from "./periodoContagem";

function ymd(data: Date): string {
  return `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, "0")}-${String(data.getDate()).padStart(2, "0")}`;
}

describe("calcularRangeContagem", () => {
  const referencia = new Date("2026-07-22T12:00:00");

  it("SEMANAL cobre a semana de segunda a domingo", () => {
    const { inicio, fim } = calcularRangeContagem("SEMANAL", referencia);
    expect(ymd(inicio)).toBe("2026-07-20");
    expect(ymd(fim)).toBe("2026-07-26");
  });

  it("MENSAL cobre do dia 1 ao último dia do mês", () => {
    const { inicio, fim } = calcularRangeContagem("MENSAL", referencia);
    expect(ymd(inicio)).toBe("2026-07-01");
    expect(ymd(fim)).toBe("2026-07-31");
  });

  it("SEMESTRAL cobre o primeiro semestre (jan-jun)", () => {
    const { inicio, fim } = calcularRangeContagem("SEMESTRAL", new Date("2026-03-10T12:00:00"));
    expect(ymd(inicio)).toBe("2026-01-01");
    expect(ymd(fim)).toBe("2026-06-30");
  });

  it("SEMESTRAL cobre o segundo semestre (jul-dez)", () => {
    const { inicio, fim } = calcularRangeContagem("SEMESTRAL", new Date("2026-11-01T12:00:00"));
    expect(ymd(inicio)).toBe("2026-07-01");
    expect(ymd(fim)).toBe("2026-12-31");
  });

  it("ANUAL cobre o ano inteiro", () => {
    const { inicio, fim } = calcularRangeContagem("ANUAL", referencia);
    expect(ymd(inicio)).toBe("2026-01-01");
    expect(ymd(fim)).toBe("2026-12-31");
  });
});
