import { describe, expect, it } from "vitest";

import { NAV_ITENS_POR_CAMINHO } from "./navegacao";

describe("navegação da plataforma", () => {
  it("expõe Minha Assinatura sem oferecer o painel B2B legado", () => {
    expect(NAV_ITENS_POR_CAMINHO["/minha-assinatura"]?.label).toBe(
      "Minha Assinatura (SysBelt)"
    );
    expect(NAV_ITENS_POR_CAMINHO["/plataforma/assinantes"]).toBeUndefined();
  });
});
