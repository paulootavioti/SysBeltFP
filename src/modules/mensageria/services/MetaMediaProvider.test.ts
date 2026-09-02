import { describe, expect, it, vi } from "vitest";
import { MetaMediaProvider } from "./MetaMediaProvider";

describe("mídia da Meta", () => {
  it("resolve e baixa mídia WhatsApp com token somente no cabeçalho", async () => {
    const fetchFn = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ url: "https://lookaside.fbsbx.com/media/arquivo", mime_type: "image/jpeg", file_size: 3 }), { status: 200 }))
      .mockResolvedValueOnce(new Response(Uint8Array.from([1, 2, 3]), { status: 200, headers: { "content-type": "image/jpeg", "content-length": "3" } }));
    const provider = new MetaMediaProvider(fetchFn, "v23.0");
    const origem = await provider.obterWhatsApp("media-1", "token-secreto");
    const arquivo = await provider.baixar(origem.url, "token-secreto");
    expect(arquivo).toMatchObject({ mime: "image/jpeg", tamanho: 3 });
    expect(fetchFn.mock.calls[0][0]).not.toContain("token-secreto");
    expect(fetchFn.mock.calls[1][1].headers).toEqual({ authorization: "Bearer token-secreto" });
  });

  it("bloqueia URL externa mesmo quando recebida no payload", async () => {
    const fetchFn = vi.fn();
    await expect(new MetaMediaProvider(fetchFn).baixar("https://exemplo.com/arquivo.jpg")).rejects.toThrow("META_MEDIA_URL_INVALIDA");
    expect(fetchFn).not.toHaveBeenCalled();
  });
});
