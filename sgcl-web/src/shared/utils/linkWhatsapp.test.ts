import { describe, expect, it } from "vitest";

import { formatarTelefoneWhatsapp, linkWhatsapp } from "./linkWhatsapp";

describe("linkWhatsapp", () => {
  it("retorna null quando não há telefone", () => {
    expect(linkWhatsapp(null, "Olá")).toBeNull();
    expect(linkWhatsapp(undefined, "Olá")).toBeNull();
  });

  it("monta a URL do wa.me com a mensagem codificada", () => {
    expect(linkWhatsapp("5511999999999", "Olá, tudo bem?")).toBe(
      "https://wa.me/5511999999999?text=Ol%C3%A1%2C%20tudo%20bem%3F"
    );
  });
});

describe("formatarTelefoneWhatsapp", () => {
  it("retorna null quando não há telefone", () => {
    expect(formatarTelefoneWhatsapp(null)).toBeNull();
    expect(formatarTelefoneWhatsapp("")).toBeNull();
  });

  it("adiciona o DDI 55 quando ausente", () => {
    expect(formatarTelefoneWhatsapp("11999999999")).toBe("5511999999999");
  });

  it("mantém o número como está quando já começa com 55", () => {
    expect(formatarTelefoneWhatsapp("5511999999999")).toBe("5511999999999");
  });

  it("remove caracteres não numéricos antes de formatar", () => {
    expect(formatarTelefoneWhatsapp("(11) 99999-9999")).toBe("5511999999999");
  });
});
