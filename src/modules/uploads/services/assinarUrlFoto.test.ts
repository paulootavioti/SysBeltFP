import { describe, it, expect, beforeAll } from "vitest";

import { assinarUrlFoto, urlFotoAssinadaValida } from "./assinarUrlFoto";

function extrair(url: string) {
  const query = new URLSearchParams(url.split("?")[1]);
  return { exp: query.get("exp"), sig: query.get("sig") };
}

describe("assinarUrlFoto", () => {
  beforeAll(() => {
    process.env.JWT_SECRET = "segredo-de-teste";
  });

  it("assina url relativa e a assinatura confere", () => {
    const url = assinarUrlFoto("/uploads/treinos/abc.png");
    const { exp, sig } = extrair(url);

    expect(url).toContain("/uploads/treinos/abc.png?");
    expect(urlFotoAssinadaValida("treinos/abc.png", exp, sig)).toBe(true);
  });

  it("não deixa a assinatura valer para outro arquivo", () => {
    const { exp, sig } = extrair(assinarUrlFoto("/uploads/treinos/abc.png"));

    expect(urlFotoAssinadaValida("treinos/outro.png", exp, sig)).toBe(false);
  });

  it("recusa assinatura expirada", () => {
    // validade negativa põe a expiração no passado
    const { exp, sig } = extrair(assinarUrlFoto("/uploads/treinos/abc.png", -10));

    expect(urlFotoAssinadaValida("treinos/abc.png", exp, sig)).toBe(false);
  });

  it("recusa assinatura adulterada ou ausente", () => {
    const { exp } = extrair(assinarUrlFoto("/uploads/treinos/abc.png"));

    expect(urlFotoAssinadaValida("treinos/abc.png", exp, "0".repeat(64))).toBe(false);
    expect(urlFotoAssinadaValida("treinos/abc.png", exp, "curta")).toBe(false);
    expect(urlFotoAssinadaValida("treinos/abc.png", exp, undefined)).toBe(false);
    expect(urlFotoAssinadaValida("treinos/abc.png", "nao-numero", "x")).toBe(false);
  });

  it("não mexe em url absoluta (storage externo)", () => {
    const externa = "https://cdn.exemplo.com/foto.png";

    expect(assinarUrlFoto(externa)).toBe(externa);
  });
});
