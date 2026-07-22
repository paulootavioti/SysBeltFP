import { describe, expect, it } from "vitest";

import { calcularRangePeriodo, montarSerie } from "./periodo";

const AGORA = new Date(2026, 6, 22, 15, 30);

describe("calcularRangePeriodo", () => {
  it("DIARIO cobre o dia inteiro de hoje, bucket por hora", () => {
    const range = calcularRangePeriodo("DIARIO", AGORA);
    expect(range.unidade).toBe("HORA");
    expect(range.inicio).toEqual(new Date(2026, 6, 22, 0, 0, 0, 0));
    expect(range.fim).toEqual(new Date(2026, 6, 23, 0, 0, 0, 0));
  });

  it("SEMANAL cobre os últimos 7 dias (incluindo hoje), bucket por dia", () => {
    const range = calcularRangePeriodo("SEMANAL", AGORA);
    expect(range.unidade).toBe("DIA");
    expect(range.inicio).toEqual(new Date(2026, 6, 16, 0, 0, 0, 0));
    expect(range.fim).toEqual(new Date(2026, 6, 23, 0, 0, 0, 0));
  });

  it("MENSAL cobre do dia 1 do mês até hoje, bucket por dia", () => {
    const range = calcularRangePeriodo("MENSAL", AGORA);
    expect(range.unidade).toBe("DIA");
    expect(range.inicio).toEqual(new Date(2026, 6, 1, 0, 0, 0, 0));
    expect(range.fim).toEqual(new Date(2026, 6, 23, 0, 0, 0, 0));
  });

  it("ANUAL cobre de janeiro até hoje, bucket por mês", () => {
    const range = calcularRangePeriodo("ANUAL", AGORA);
    expect(range.unidade).toBe("MES");
    expect(range.inicio).toEqual(new Date(2026, 0, 1, 0, 0, 0, 0));
    expect(range.fim).toEqual(new Date(2026, 6, 23, 0, 0, 0, 0));
  });
});

describe("montarSerie", () => {
  it("gera um bucket vazio (zerado) por dia para SEMANAL, mesmo sem itens", () => {
    const range = calcularRangePeriodo("SEMANAL", AGORA);
    const serie = montarSerie(range, []);
    expect(serie).toHaveLength(7);
    expect(serie.every((p) => p.valor === 0)).toBe(true);
    expect(serie[serie.length - 1].rotulo).toBe("22/07");
  });

  it("conta ocorrências por dia quando não há valorPorItem", () => {
    const range = calcularRangePeriodo("SEMANAL", AGORA);
    const itens = [
      new Date(2026, 6, 22, 9, 0),
      new Date(2026, 6, 22, 18, 0),
      new Date(2026, 6, 20, 10, 0),
    ];
    const serie = montarSerie(range, itens);
    const total = serie.reduce((soma, p) => soma + p.valor, 0);
    expect(total).toBe(3);
    expect(serie[serie.length - 1].valor).toBe(2);
  });

  it("soma o valor de cada item quando valorPorItem é informado", () => {
    const range = calcularRangePeriodo("DIARIO", AGORA);
    const itens = [new Date(2026, 6, 22, 8, 0), new Date(2026, 6, 22, 8, 45)];
    const serie = montarSerie(range, itens, (i) => (i === 0 ? 150 : 90));
    const bucket8h = serie.find((p) => p.rotulo === "08h");
    expect(bucket8h?.valor).toBe(240);
  });

  it("ignora itens fora do range (não incrementa nenhum bucket, não quebra)", () => {
    const range = calcularRangePeriodo("SEMANAL", AGORA);
    const itemForaDoRange = [new Date(2025, 0, 1)];
    const serie = montarSerie(range, itemForaDoRange);
    expect(serie.every((p) => p.valor === 0)).toBe(true);
  });
});
