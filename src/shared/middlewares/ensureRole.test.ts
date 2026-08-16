import { describe, expect, it, vi } from "vitest";

import { ensureRole } from "./ensureRole";

function requisicao(perfil: string) {
  return { user: { id: 1, perfil, unidadeId: null } } as never;
}

describe("autorização do Tenant Plane", () => {
  it("não concede mais bypass global a SUPERADMIN", () => {
    const next = vi.fn();

    expect(() => ensureRole(["ADMIN"])(requisicao("SUPERADMIN"), {} as never, next)).toThrow(
      "Acesso negado."
    );
    expect(next).not.toHaveBeenCalled();
  });

  it("mantém a herança de ADMIN para DONO", () => {
    const next = vi.fn();

    ensureRole(["ADMIN"])(requisicao("DONO"), {} as never, next);

    expect(next).toHaveBeenCalledOnce();
  });
});
