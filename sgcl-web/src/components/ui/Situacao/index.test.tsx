import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { Situacao, type DegrauSituacao } from ".";

describe("Situacao", () => {
  it.each<[DegrauSituacao, string]>([
    ["neutro", "Em dia"],
    ["atencao", "Vence em 3 dias"],
    ["acao", "Vencida há 12 dias"],
    ["inativo", "Matrícula inativa"],
  ])("renderiza o degrau %s", (degrau, texto) => {
    const html = renderToStaticMarkup(<Situacao degrau={degrau}>{texto}</Situacao>);
    expect(html).toContain(texto);
    expect(html).toContain(`situacao-${degrau}`);
  });
});
