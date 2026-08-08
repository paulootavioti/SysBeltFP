import { describe, expect, it } from "vitest";

import { competenciaDoMes, formatarCompetencia, vencimentoDaCompetencia } from "./competencia";

describe("competenciaDoMes", () => {
  it("ancora no dia 1º à meia-noite UTC", () => {
    expect(competenciaDoMes(new Date("2026-08-17T13:45:00Z")).toISOString()).toBe(
      "2026-08-01T00:00:00.000Z"
    );
  });

  it("não escorrega de mês pra quem roda o fechamento de madrugada", () => {
    // 1º de agosto às 02:00 UTC é ainda 31 de JULHO em Brasília (UTC-3).
    // Se o cálculo usasse os acessores locais, a fatura sairia com
    // competência de julho e a trava de duplicidade não pegaria.
    expect(competenciaDoMes(new Date("2026-08-01T02:00:00Z")).toISOString()).toBe(
      "2026-08-01T00:00:00.000Z"
    );

    // e o inverso: 31 de agosto às 23:00 UTC ainda é agosto.
    expect(competenciaDoMes(new Date("2026-08-31T23:00:00Z")).toISOString()).toBe(
      "2026-08-01T00:00:00.000Z"
    );
  });
});

describe("vencimentoDaCompetencia", () => {
  const agosto = competenciaDoMes(new Date("2026-08-10T00:00:00Z"));

  it("usa o dia configurado dentro do próprio mês", () => {
    expect(vencimentoDaCompetencia(agosto, 10).toISOString()).toBe("2026-08-10T00:00:00.000Z");
  });

  it("prende no último dia quando o mês é mais curto", () => {
    const fevereiro = competenciaDoMes(new Date("2026-02-05T00:00:00Z"));
    expect(vencimentoDaCompetencia(fevereiro, 31).toISOString()).toBe("2026-02-28T00:00:00.000Z");

    // 2028 é bissexto.
    const fevereiroBissexto = competenciaDoMes(new Date("2028-02-05T00:00:00Z"));
    expect(vencimentoDaCompetencia(fevereiroBissexto, 31).toISOString()).toBe(
      "2028-02-29T00:00:00.000Z"
    );
  });

  it("nunca cai fora do mês da competência", () => {
    for (let mes = 0; mes < 12; mes++) {
      const competencia = new Date(Date.UTC(2026, mes, 1));

      for (const dia of [1, 15, 28, 29, 30, 31]) {
        const vencimento = vencimentoDaCompetencia(competencia, dia);

        expect(vencimento.getUTCMonth()).toBe(mes);
        expect(vencimento.getUTCFullYear()).toBe(2026);
      }
    }
  });

  it("trata dia inválido sem gerar data absurda", () => {
    expect(vencimentoDaCompetencia(agosto, 0).getUTCDate()).toBe(1);
    expect(vencimentoDaCompetencia(agosto, -5).getUTCDate()).toBe(1);
    expect(vencimentoDaCompetencia(agosto, 99).getUTCDate()).toBe(31);
  });
});

describe("formatarCompetencia", () => {
  it("mostra o mês por extenso sem trocar de mês por fuso", () => {
    expect(formatarCompetencia(new Date("2026-08-01T00:00:00Z"))).toBe("agosto de 2026");
    expect(formatarCompetencia(new Date("2026-01-01T00:00:00Z"))).toBe("janeiro de 2026");
  });
});
