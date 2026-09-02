import { describe, expect, it, vi } from "vitest";
import { MetaTemplateProvider } from "./MetaTemplateProvider";

describe("templates da Meta", () => {
  it("pagina pelo cursor sem colocar o token na URL", async () => {
    const fetchFn = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ data: [{ id: "1", name: "retomar", language: "pt_BR", status: "APPROVED", components: [] }], paging: { next: "https://proxima", cursors: { after: "cursor-2" } } }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ data: [{ id: "2", name: "boas_vindas", language: "pt_BR", status: "PENDING", components: [] }] }), { status: 200 }));
    const resultado = await new MetaTemplateProvider(fetchFn, "v23.0").listar("waba-1", "token-secreto");
    expect(resultado).toHaveLength(2);
    expect(fetchFn.mock.calls[1][0]).toContain("after=cursor-2");
    expect(fetchFn.mock.calls[0][0]).not.toContain("token-secreto");
    expect(fetchFn.mock.calls[0][1].headers).toEqual({ authorization: "Bearer token-secreto" });
  });

  it("normaliza falha da Graph API", async () => {
    const fetchFn = vi.fn().mockResolvedValue(new Response(JSON.stringify({ error: { message: "sensível" } }), { status: 403 }));
    await expect(new MetaTemplateProvider(fetchFn).listar("waba", "token")).rejects.toThrow("META_TEMPLATES_INDISPONIVEIS");
  });
});
