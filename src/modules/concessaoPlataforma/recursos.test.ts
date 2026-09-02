import { describe, expect, it, vi } from "vitest";

import { tenantTemRecurso } from "./recursos";

function repositorio(concessao: {
  statusAcesso: "ATIVO" | "SUSPENSO" | "CANCELADO";
  expiraEm: Date;
  recursos: string[];
} | null) {
  return {
    unidade: { findUnique: vi.fn().mockResolvedValue({ contaId: 10 }) },
    concessaoPlataforma: {
      findUnique: vi.fn().mockResolvedValue(concessao),
    },
  };
}

describe("recursos da concessão local", () => {
  const agora = new Date("2026-08-12T15:00:00.000Z");

  it("libera somente recurso presente em concessão ativa e válida", async () => {
    const db = repositorio({
      statusAcesso: "ATIVO",
      expiraEm: new Date("2026-08-13T15:00:00.000Z"),
      recursos: ["WHATSAPP"],
    });
    expect(await tenantTemRecurso("WHATSAPP", agora, db as never, 1)).toBe(true);
    expect(await tenantTemRecurso("CONTROLE_ACESSO", agora, db as never, 1)).toBe(false);
  });

  it.each([
    ["sem concessão", null],
    ["suspensa", { statusAcesso: "SUSPENSO", expiraEm: new Date("2026-08-13T15:00:00.000Z"), recursos: ["WHATSAPP"] }],
    ["expirada", { statusAcesso: "ATIVO", expiraEm: agora, recursos: ["WHATSAPP"] }],
  ])("falha fechado quando está %s", async (_caso, concessao) => {
    expect(await tenantTemRecurso("WHATSAPP", agora, repositorio(concessao as never) as never, 1)).toBe(false);
  });

  it("consulta a concessao da conta derivada da unidade", async () => {
    const db = repositorio(null);
    await tenantTemRecurso("WHATSAPP", agora, db as never, 77);
    expect(db.unidade.findUnique).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 77 } }));
    expect(db.concessaoPlataforma.findUnique).toHaveBeenCalledWith({ where: { contaId: 10 } });
  });
});
