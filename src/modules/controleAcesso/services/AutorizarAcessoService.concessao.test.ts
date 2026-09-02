import { describe, expect, it, vi } from "vitest";

import { AutorizarAcessoService } from "./AutorizarAcessoService";

describe("concessão na autorização de acesso", () => {
  it("nao consulta concessao sem identificar a unidade da pessoa", async () => {
    const temRecurso = vi.fn().mockResolvedValue(false);
    const decisao = await new AutorizarAcessoService(temRecurso).execute({ credencialId: 999999 });

    expect(temRecurso).not.toHaveBeenCalled();
    expect(decisao).toEqual({
      autorizado: false,
      motivo: "Credencial não reconhecida",
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
