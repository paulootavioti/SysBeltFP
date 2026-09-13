import { describe, expect, it } from "vitest";
import { validarResultadoAgendado } from "./validarResultadoAgendado";

describe("rotina agendada de snapshots", () => {
  it("resume envios de todas as contas", () => {
    expect(validarResultadoAgendado([
      { tenantKey: "a", eventoId: "e1", duplicado: false },
      { tenantKey: "b", eventoId: "e2", duplicado: true },
    ])).toEqual({ enviados: 2, duplicados: 1 });
  });

  it("falha a execução quando qualquer conta não é enviada", () => {
    expect(() => validarResultadoAgendado([
      { tenantKey: "a", eventoId: "e1", duplicado: false },
      { tenantKey: "b", erro: "FALHA_NO_SNAPSHOT" },
    ])).toThrow("Falha no envio de 1 de 2 snapshot(s).");
  });
});
