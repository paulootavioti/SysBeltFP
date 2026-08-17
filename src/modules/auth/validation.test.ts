import { describe, expect, it } from "vitest";

import { registerSchema } from "./validation";

const usuarioValido = {
  nome: "Gestor",
  email: "gestor@example.com",
  senha: "senha123",
};

describe("perfis aceitos no Tenant Plane", () => {
  it("aceita perfis da academia e rejeita SUPERADMIN", () => {
    expect(registerSchema.safeParse({ ...usuarioValido, perfil: "ADMIN" }).success).toBe(true);
    expect(registerSchema.safeParse({ ...usuarioValido, perfil: "SUPERADMIN" }).success).toBe(false);
  });
});
