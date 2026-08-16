import { describe, expect, it } from "vitest";

import { usuarioSchema } from "./usuario.schema";

const usuarioValido = {
  nome: "Administrador da academia",
  email: "admin@academia.test",
  senha: "senha-segura",
};

describe("perfis do formulário de usuário", () => {
  it("aceita perfis operacionais e não oferece SUPERADMIN no Tenant Plane", () => {
    expect(usuarioSchema.safeParse({ ...usuarioValido, perfil: "ADMIN" }).success).toBe(true);
    expect(usuarioSchema.safeParse({ ...usuarioValido, perfil: "SUPERADMIN" }).success).toBe(false);
  });
});
