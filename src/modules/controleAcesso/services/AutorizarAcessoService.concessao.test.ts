import { describe, expect, it, vi } from "vitest";

import { AutorizarAcessoService } from "./AutorizarAcessoService";

describe("concessão na autorização de acesso", () => {
  it("nega entrada antes de consultar credenciais quando o recurso não está disponível", async () => {
    const temRecurso = vi.fn().mockResolvedValue(false);
    const decisao = await new AutorizarAcessoService(temRecurso).execute({ credencialId: 999999 });

    expect(temRecurso).toHaveBeenCalledWith("CONTROLE_ACESSO", expect.any(Date));
    expect(decisao).toEqual({
      autorizado: false,
      motivo: "Controle de acesso indisponível para esta assinatura",
    });
  });

  it("sempre libera saída por segurança física", async () => {
    const temRecurso = vi.fn().mockResolvedValue(false);
    const decisao = await new AutorizarAcessoService(temRecurso).execute({
      sentido: "SAIDA", alunoId: 12,
    });

    expect(decisao.autorizado).toBe(true);
    expect(temRecurso).not.toHaveBeenCalled();
  });
});
