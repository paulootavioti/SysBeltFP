import { describe, expect, it } from "vitest";

import { gerarTokenRedefinicaoSenha, hashTokenRedefinicaoSenha } from "./tokenRedefinicaoSenha";

describe("token de redefinição de senha", () => {
  it("gera token forte e persiste somente um hash determinístico", () => {
    const primeiro = gerarTokenRedefinicaoSenha();
    const segundo = gerarTokenRedefinicaoSenha();

    expect(primeiro.token).toHaveLength(64);
    expect(primeiro.tokenHash).toBe(hashTokenRedefinicaoSenha(primeiro.token));
    expect(primeiro.tokenHash).not.toBe(primeiro.token);
    expect(segundo.token).not.toBe(primeiro.token);
  });
});
