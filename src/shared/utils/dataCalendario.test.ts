import { describe, expect, it } from "vitest";

import {
  comHorarioUTC,
  diaDaSemanaUTC,
  fimDoDiaUTC,
  formatarDataBR,
  inicioDoDiaUTC,
  parsearDataAcademia,
  somarDiasUTC,
} from "./dataCalendario";

// Este arquivo é a rede de proteção contra a classe de bug que fez a data
// do contrato sair um dia antes: como o CI roda em UTC, um teste comum
// passa mesmo com o código errado. Aqui a expectativa é escrita de forma
// que só passa se o resultado NÃO depender do fuso do processo.

describe("formatarDataBR", () => {
  it("formata o dia do calendário, não o dia local", () => {
    // meia-noite UTC de 15/01: em Brasília (UTC-3) este instante é
    // 14/01 às 21h. Formatar sem timeZone imprimiria 14/01.
    expect(formatarDataBR(new Date("2026-01-15"))).toBe("15/01/2026");
  });

  it("não desloca o dia em nenhuma virada de mês ou ano", () => {
    expect(formatarDataBR(new Date("2026-01-01"))).toBe("01/01/2026");
    expect(formatarDataBR(new Date("2025-12-31"))).toBe("31/12/2025");
    expect(formatarDataBR(new Date("2026-03-01"))).toBe("01/03/2026");
  });
});

describe("limites de dia", () => {
  it("inicioDoDiaUTC e fimDoDiaUTC cobrem o dia inteiro sem vazar pro vizinho", () => {
    const meioDia = new Date("2026-08-15T12:00:00Z");

    expect(inicioDoDiaUTC(meioDia).toISOString()).toBe("2026-08-15T00:00:00.000Z");
    expect(fimDoDiaUTC(meioDia).toISOString()).toBe("2026-08-15T23:59:59.999Z");
  });
});

describe("aritmética de calendário", () => {
  it("diaDaSemanaUTC identifica a segunda-feira certa", () => {
    // 03/08/2026 é uma segunda-feira.
    expect(diaDaSemanaUTC(new Date("2026-08-03"))).toBe(1);
    expect(diaDaSemanaUTC(new Date("2026-08-02"))).toBe(0);
  });

  it("somarDiasUTC atravessa a virada de mês corretamente", () => {
    expect(formatarDataBR(somarDiasUTC(new Date("2026-08-31"), 1))).toBe("01/09/2026");
    expect(formatarDataBR(somarDiasUTC(new Date("2026-02-28"), 1))).toBe("01/03/2026");
  });

  it("percorre agosto/2026 e encontra as 5 segundas-feiras", () => {
    const segundas: string[] = [];

    for (
      let cursor = new Date("2026-08-01");
      cursor <= fimDoDiaUTC(new Date("2026-08-31"));
      cursor = somarDiasUTC(cursor, 1)
    ) {
      if (diaDaSemanaUTC(cursor) === 1) segundas.push(formatarDataBR(cursor));
    }

    expect(segundas).toEqual([
      "03/08/2026",
      "10/08/2026",
      "17/08/2026",
      "24/08/2026",
      "31/08/2026",
    ]);
  });

  it("comHorarioUTC fixa a hora sem mudar o dia", () => {
    const aula = comHorarioUTC(new Date("2026-08-03"), 19, 30);

    expect(aula.toISOString()).toBe("2026-08-03T19:30:00.000Z");
    expect(formatarDataBR(aula)).toBe("03/08/2026");
  });
});

describe("parsearDataAcademia", () => {
  it("guarda o horário digitado como relógio de parede, sem converter", () => {
    // é este o caso que fazia o professor programar 18:00 e ver 15:00.
    expect(parsearDataAcademia("2026-08-10T18:00").toISOString()).toBe(
      "2026-08-10T18:00:00.000Z"
    );
    expect(parsearDataAcademia("2026-08-10T18:00:00").toISOString()).toBe(
      "2026-08-10T18:00:00.000Z"
    );
  });

  it("mantém a data sem hora ancorada na meia-noite do próprio dia", () => {
    expect(parsearDataAcademia("2026-08-10").toISOString()).toBe(
      "2026-08-10T00:00:00.000Z"
    );
  });

  it("respeita o fuso quando ele vem explícito", () => {
    expect(parsearDataAcademia("2026-08-10T18:00:00Z").toISOString()).toBe(
      "2026-08-10T18:00:00.000Z"
    );
    expect(parsearDataAcademia("2026-08-10T18:00:00-03:00").toISOString()).toBe(
      "2026-08-10T21:00:00.000Z"
    );
  });

  it("é estável entre fusos — o mesmo texto vira sempre o mesmo instante", () => {
    // sem o helper, este valor mudaria conforme a máquina do servidor.
    expect(parsearDataAcademia("2026-12-31T23:30").toISOString()).toBe(
      "2026-12-31T23:30:00.000Z"
    );
  });
});
