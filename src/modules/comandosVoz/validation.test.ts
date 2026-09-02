import { describe, expect, it } from "vitest";
import { comandoVozSchema } from "./validation";

describe("comandos de voz", () => {
  it("aceita somente as cinco ações de cronômetro", () => {
    for (const acao of ["INICIAR", "PAUSAR", "AVANCAR", "CONSULTAR", "BLOCO_PAUSA"]) {
      const resultado = comandoVozSchema.safeParse({
        gatilho: "Alexa, comando de teste",
        resposta: "Comando confirmado.",
        acao,
        ...(acao === "BLOCO_PAUSA" ? { duracaoBlocoSegundos: 60 } : {}),
      });
      expect(resultado.success).toBe(true);
    }

    expect(comandoVozSchema.safeParse({
      gatilho: "Alexa, marcar presença",
      resposta: "Não permitido.",
      acao: "MARCAR_PRESENCA",
    }).success).toBe(false);
  });

  it("exige duração para bloco de pausa", () => {
    expect(comandoVozSchema.safeParse({ gatilho: "Alexa, água", resposta: "Pausa iniciada.", acao: "BLOCO_PAUSA" }).success).toBe(false);
  });
});
