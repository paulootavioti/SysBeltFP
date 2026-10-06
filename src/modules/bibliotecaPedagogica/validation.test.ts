import { describe, expect, it } from "vitest";
import { conteudoTecnicoSchema, templatePlanejamentoSchema } from "./validation";

describe("validação da biblioteca pedagógica", () => {
  it("aceita conteúdo técnico com campos de segurança e tags", () => {
    const conteudo = conteudoTecnicoSchema.parse({ modalidadeId: 1, tipo: "RASPAGEM", nome: "Raspagem de gancho", duracaoSugeridaSegundos: 480, nivelDificuldade: "BASICO", cuidados: "Interromper diante de desconforto.", tags: ["guarda", "controle"] });
    expect(conteudo.tags).toEqual(["guarda", "controle"]);
    expect(conteudo.nivelDificuldade).toBe("BASICO");
  });

  it("rejeita etapas sem duração segura", () => {
    expect(() => templatePlanejamentoSchema.parse({ nome: "Aula", etapas: [{ tipo: "TECNICA", titulo: "Técnica", duracaoSegundos: 0 }] })).toThrow();
  });
});
