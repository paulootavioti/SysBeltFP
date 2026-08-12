import { describe, expect, it, vi } from "vitest";

import { AppError } from "../../shared/errors/AppError";
import { exigirRecursoTenant } from "./exigirRecursoTenant";

describe("middleware de recurso do tenant", () => {
  it("prossegue quando a concessão libera o recurso", async () => {
    const next = vi.fn();
    await exigirRecursoTenant("CONTROLE_ACESSO", async () => true)({} as never, {} as never, next);
    expect(next).toHaveBeenCalledWith();
  });

  it("responde pela cadeia de erros com 403 quando bloqueado", async () => {
    const next = vi.fn();
    await exigirRecursoTenant("CONTROLE_ACESSO", async () => false)({} as never, {} as never, next);
    const erro = next.mock.calls[0][0];
    expect(erro).toBeInstanceOf(AppError);
    expect(erro.statusCode).toBe(403);
  });
});
