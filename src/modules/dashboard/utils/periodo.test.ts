import { describe, expect, it } from "vitest";

import {
  agruparPorBucket,
  calcularRangePeriodo,
  calcularRangePeriodoAnterior,
  calcularVariacaoPercentual,
  divisoesDoPeriodo,
  montarSerie,
} from "./periodo";

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

describe("agruparPorBucket", () => {
  it("agrupa os itens de cada bucket, mantendo o item original (não só um total)", () => {
    const range = calcularRangePeriodo("SEMANAL", AGORA);
    const itens = [
      { valor: 10, data: new Date(2026, 6, 22, 9, 0) },
      { valor: 20, data: new Date(2026, 6, 22, 18, 0) },
      { valor: 5, data: new Date(2026, 6, 20, 10, 0) },
    ];

    const grupos = agruparPorBucket(range, itens, (item) => item.data);

    expect(grupos).toHaveLength(7);
    expect(grupos[grupos.length - 1].itens).toHaveLength(2);
    expect(grupos[grupos.length - 1].itens.reduce((soma, i) => soma + i.valor, 0)).toBe(30);
  });

  it("devolve bucket vazio (array []) quando não há itens naquela data", () => {
    const range = calcularRangePeriodo("SEMANAL", AGORA);
    const grupos = agruparPorBucket(range, [] as { data: Date }[], (item) => item.data);
    expect(grupos.every((g) => g.itens.length === 0)).toBe(true);
  });
});

describe("calcularRangePeriodoAnterior", () => {
  it("DIARIO: o dia anterior completo", () => {
    const range = calcularRangePeriodoAnterior("DIARIO", AGORA);
    expect(range.inicio).toEqual(new Date(2026, 6, 21, 0, 0, 0, 0));
    expect(range.fim).toEqual(new Date(2026, 6, 22, 0, 0, 0, 0));
  });

  it("SEMANAL: os 7 dias imediatamente antes do período atual", () => {
    const range = calcularRangePeriodoAnterior("SEMANAL", AGORA);
    expect(range.inicio).toEqual(new Date(2026, 6, 9, 0, 0, 0, 0));
    expect(range.fim).toEqual(new Date(2026, 6, 16, 0, 0, 0, 0));
  });

  it("MENSAL: o mês calendário anterior inteiro", () => {
    const range = calcularRangePeriodoAnterior("MENSAL", AGORA);
    expect(range.inicio).toEqual(new Date(2026, 5, 1, 0, 0, 0, 0));
    expect(range.fim).toEqual(new Date(2026, 6, 1, 0, 0, 0, 0));
  });

  it("ANUAL: o ano calendário anterior inteiro", () => {
    const range = calcularRangePeriodoAnterior("ANUAL", AGORA);
    expect(range.inicio).toEqual(new Date(2025, 0, 1, 0, 0, 0, 0));
    expect(range.fim).toEqual(new Date(2026, 0, 1, 0, 0, 0, 0));
  });
});

describe("divisoesDoPeriodo", () => {
  it("DIARIO: 24 (por hora)", () => {
    expect(divisoesDoPeriodo("DIARIO", AGORA)).toEqual({ quantidade: 24, unidadeTexto: "por hora" });
  });

  it("SEMANAL: 7 (por dia)", () => {
    expect(divisoesDoPeriodo("SEMANAL", AGORA)).toEqual({ quantidade: 7, unidadeTexto: "por dia" });
  });

  it("MENSAL: número de semanas do mês corrente (por semana)", () => {
    // Julho/2026 tem 31 dias -> ceil(31/7) = 5 semanas
    expect(divisoesDoPeriodo("MENSAL", AGORA)).toEqual({ quantidade: 5, unidadeTexto: "por semana" });
  });

  it("ANUAL: 12 (por mês)", () => {
    expect(divisoesDoPeriodo("ANUAL", AGORA)).toEqual({ quantidade: 12, unidadeTexto: "por mês" });
  });
});

describe("calcularVariacaoPercentual", () => {
  it("calcula a variação percentual normal", () => {
    expect(calcularVariacaoPercentual(110, 100).percentual).toBeCloseTo(10);
    expect(calcularVariacaoPercentual(80, 100).percentual).toBeCloseTo(-20);
  });

  it("anterior zero e atual zero -> 0 (sem variação)", () => {
    expect(calcularVariacaoPercentual(0, 0).percentual).toBe(0);
  });

  it("anterior zero e atual maior que zero -> null (\"Novo no período\", nunca uma % artificial)", () => {
    expect(calcularVariacaoPercentual(15, 0).percentual).toBeNull();
  });
});
