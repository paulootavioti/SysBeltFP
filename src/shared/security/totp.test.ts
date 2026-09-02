import { describe, expect, it } from "vitest";
import { criarUriTotp, gerarCodigoTotp, verificarCodigoTotp } from "./totp";

describe("TOTP", () => {
  const segredoRfc = "GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ";

  it("reproduz os vetores do RFC 6238", () => {
    expect(gerarCodigoTotp(segredoRfc, 59_000, 8)).toBe("94287082");
    expect(gerarCodigoTotp(segredoRfc, 1_111_111_109_000, 8)).toBe("07081804");
  });

  it("aceita uma janela adjacente e rejeita código inválido", () => {
    const codigoAnterior = gerarCodigoTotp(segredoRfc, 30_000);
    expect(verificarCodigoTotp(segredoRfc, codigoAnterior, 60_000)).toBe(true);
    expect(verificarCodigoTotp(segredoRfc, "12345x", 60_000)).toBe(false);
  });

  it("gera URI reconhecida por aplicativos autenticadores", () => {
    expect(criarUriTotp("ABC", "dono@dojo.com")).toContain("otpauth://totp/Sys%20Belt%3Adono%40dojo.com");
  });
});
