import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { DataTable } from ".";

describe("DataTable responsiva", () => {
  it("oferece tabela e cartão móvel sem duplicar os dados", () => {
    const html = renderToStaticMarkup(<DataTable data={[{ id: 1, nome: "Ana" }]} columns={[{ header: "Nome", accessor: "nome", prioridade: 1 }]} renderCartao={(item) => <article>{item.nome}</article>} densidade="confortavel" />);
    expect(html).toContain("data-table-com-cartoes");
    expect(html).toContain("data-table-confortavel");
    expect(html).toContain("data-table-prioridade-1");
    expect(html).toContain("<article>Ana</article>");
    expect(html).toContain("<table");
  });
});
