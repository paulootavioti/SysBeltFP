import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { AmostraFaixa } from ".";

describe("AmostraFaixa", () => {
  it("expõe a graduação e aplica uma cor persistida válida", () => {
    const html = renderToStaticMarkup(<AmostraFaixa cor="#6f2da8" graduacao="Roxa · 1º grau" />);
    expect(html).toContain('aria-label="Graduação Roxa · 1º grau"');
    expect(html).toContain("background-color:#6f2da8");
  });

  it("usa a amostra neutra quando a cor não foi cadastrada", () => {
    const html = renderToStaticMarkup(<AmostraFaixa cor={null} graduacao="Branca" compacta />);
    expect(html).toContain("amostra-faixa-compacta");
    expect(html).not.toContain("background-color");
  });
});
