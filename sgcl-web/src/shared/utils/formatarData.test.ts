import { describe, expect, it } from "vitest";

import {
  formatarData,
  formatarDataExtenso,
  formatarDataHoraAula,
  formatarHoraAula,
} from "./formatarData";

// Estes testes rodam com TZ=America/Sao_Paulo no CI. Em UTC eles passariam
// mesmo com o código errado — é exatamente esse falso verde que deixou a
// data de vencimento aparecer um dia antes por tanto tempo.

describe("formatarData", () => {
  it("mostra o dia do calendário, não o dia do navegador", () => {
    expect(formatarData("2026-01-15T00:00:00.000Z")).toBe("15/01/2026");
  });

  it("não desloca na virada de mês nem de ano", () => {
    expect(formatarData("2026-01-01T00:00:00.000Z")).toBe("01/01/2026");
    expect(formatarData("2025-12-31T00:00:00.000Z")).toBe("31/12/2025");
  });

  it("aceita string, número e Date", () => {
    const iso = "2026-06-10T00:00:00.000Z";

    expect(formatarData(iso)).toBe("10/06/2026");
    expect(formatarData(new Date(iso))).toBe("10/06/2026");
    expect(formatarData(new Date(iso).getTime())).toBe("10/06/2026");
  });
});

describe("formatarDataExtenso", () => {
  it("acerta o dia da semana", () => {
    // 10/08/2026 é uma segunda-feira.
    expect(formatarDataExtenso("2026-08-10T00:00:00.000Z")).toContain("segunda-feira");
  });
});

describe("horário de aula", () => {
  it("mostra o horário que o professor digitou, sem converter", () => {
    // o caso que fazia programar 18:00 e a grade exibir 15:00.
    expect(formatarDataHoraAula("2026-08-10T18:00:00.000Z")).toContain("18:00");
    expect(formatarHoraAula("2026-08-10T18:00:00.000Z")).toBe("18:00");
  });

  it("mantém o dia certo numa aula perto da meia-noite", () => {
    expect(formatarDataHoraAula("2026-08-10T22:00:00.000Z")).toContain("10/08/2026");
  });
});
