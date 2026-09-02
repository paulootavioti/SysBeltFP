import { describe, expect, it, vi } from "vitest";
import { ProcessarMidiasMensageriaService } from "./ProcessarMidiasMensageriaService";

function mensagem() {
  return { id: 1, mediaStatus: "PENDENTE", mediaExternaId: "media-1", mediaUrlOrigem: null, tentativasMedia: 0, proximaTentativaMediaEm: null, canalMensageria: { tipo: "WHATSAPP", tokenRef: "secret" } };
}

describe("processamento de mídias", () => {
  it("reserva, armazena e remove a URL temporária", async () => {
    const db = { mensagemMensageria: { findMany: vi.fn().mockResolvedValue([mensagem()]), updateMany: vi.fn().mockResolvedValue({ count: 1 }), update: vi.fn().mockResolvedValue({}) } };
    const meta = { obterWhatsApp: vi.fn().mockResolvedValue({ url: "https://lookaside.fbsbx.com/midia", mime: "image/jpeg", tamanho: 3 }), baixar: vi.fn().mockResolvedValue({ buffer: Buffer.from([1, 2, 3]), mime: "image/jpeg", tamanho: 3 }) };
    const segredos = { obter: vi.fn().mockResolvedValue("token") }; const store = { set: vi.fn().mockResolvedValue(undefined) };
    expect(await new ProcessarMidiasMensageriaService(db as never, meta as never, segredos, store).executar()).toMatchObject({ processadas: 1, falhas: 0 });
    expect(store.set).toHaveBeenCalledWith(expect.stringMatching(/^mensageria\/.+\.jpg$/), expect.any(Blob), expect.anything());
    expect(db.mensagemMensageria.update).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ mediaStatus: "DISPONIVEL", arquivoMime: "image/jpeg", mediaUrlOrigem: null }) }));
  });

  it("rejeita arquivo acima do limite sem baixar", async () => {
    const db = { mensagemMensageria: { findMany: vi.fn().mockResolvedValue([mensagem()]), updateMany: vi.fn().mockResolvedValue({ count: 1 }), update: vi.fn().mockResolvedValue({}) } };
    const meta = { obterWhatsApp: vi.fn().mockResolvedValue({ url: "https://lookaside.fbsbx.com/midia", mime: "video/mp4", tamanho: 17 * 1024 * 1024 }), baixar: vi.fn() };
    const segredos = { obter: vi.fn().mockResolvedValue("token") }; const store = { set: vi.fn() };
    expect(await new ProcessarMidiasMensageriaService(db as never, meta as never, segredos, store).executar()).toMatchObject({ processadas: 0, falhas: 1 });
    expect(meta.baixar).not.toHaveBeenCalled(); expect(store.set).not.toHaveBeenCalled();
    expect(db.mensagemMensageria.update).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ mediaStatus: "FALHOU", erroMedia: "MEDIA_NAO_SUPORTADA" }) }));
  });

  it("ignora mensagem já reservada por outro worker", async () => {
    const db = { mensagemMensageria: { findMany: vi.fn().mockResolvedValue([mensagem()]), updateMany: vi.fn().mockResolvedValue({ count: 0 }), update: vi.fn() } };
    const meta = { obterWhatsApp: vi.fn() };
    expect(await new ProcessarMidiasMensageriaService(db as never, meta as never, { obter: vi.fn() }, { set: vi.fn() }).executar()).toMatchObject({ processadas: 0 });
    expect(meta.obterWhatsApp).not.toHaveBeenCalled();
  });
});
