import { describe, expect, it, vi } from "vitest";

vi.mock("../../services/api", () => ({ api: { defaults: { baseURL: "https://sysbelt.netlify.app/api/" } } }));

const { resolverUrlUpload } = await import("./resolverUrlUpload");

describe("resolverUrlUpload", () => {
  // O backend guarda o caminho relativo a ELE. Num <img> do frontend, esse
  // caminho resolveria contra o domínio do app, que não serve /uploads.
  it("prefixa o caminho relativo com a base da API", () => {
    expect(resolverUrlUpload("/uploads/treinos/x.png")).toBe(
      "https://sysbelt.netlify.app/api/uploads/treinos/x.png"
    );
  });

  it("acrescenta a barra quando o caminho não começa com uma", () => {
    expect(resolverUrlUpload("uploads/x.png")).toBe(
      "https://sysbelt.netlify.app/api/uploads/x.png"
    );
  });

  it("preserva a query de assinatura do backend", () => {
    expect(resolverUrlUpload("/uploads/x.png?exp=123&sig=abc")).toBe(
      "https://sysbelt.netlify.app/api/uploads/x.png?exp=123&sig=abc"
    );
  });

  it("não mexe em url absoluta", () => {
    expect(resolverUrlUpload("https://cdn.exemplo.com/x.png")).toBe(
      "https://cdn.exemplo.com/x.png"
    );
    expect(resolverUrlUpload("//cdn.exemplo.com/x.png")).toBe("//cdn.exemplo.com/x.png");
  });

  it("não mexe em data: url", () => {
    expect(resolverUrlUpload("data:image/png;base64,iVBORw0KGgo=")).toBe(
      "data:image/png;base64,iVBORw0KGgo="
    );
  });

  // Sem esta guarda, string vazia virava a raiz da API — um <img> apontando
  // para o JSON da API, que renderiza como imagem quebrada.
  it("devolve a string vazia intacta", () => {
    expect(resolverUrlUpload("")).toBe("");
  });
});
