import { describe, expect, it, vi } from "vitest";
import { ArmazenarAnexoMensageriaService } from "./ArmazenarAnexoMensageriaService";

function conversa(tipo: "WHATSAPP" | "INSTAGRAM" = "WHATSAPP", entrada = new Date()) {
  return { id: 1, unidadeId: 7, canalMensageriaId: 3, leadId: 9, atendenteId: null, estado: "EM_ATENDIMENTO", canalMensageria: { tipo }, mensagens: [{ enviadaEm: entrada }] };
}

function banco(valor: ReturnType<typeof conversa> | null) {
  const tx = { mensagemMensageria: { create: vi.fn().mockResolvedValue({ id: 11, enviadaEm: new Date(), tipoConteudo: "IMAGEM" }) }, conversaMensageria: { update: vi.fn() }, leadEvento: { create: vi.fn() } };
  return { db: { conversaMensageria: { findFirst: vi.fn().mockResolvedValue(valor) }, $transaction: vi.fn(async (callback: (cliente: typeof tx) => Promise<unknown>) => callback(tx)) }, tx };
}

describe("anexo do atendimento", () => {
  it("armazena e cria mensagem auditável na unidade", async () => {
    const { db, tx } = banco(conversa()); const store = { set: vi.fn().mockResolvedValue(undefined) };
    await new ArmazenarAnexoMensageriaService(db as never, store).executar({ conversaId: 1, unidadeId: 7, usuarioId: 5, buffer: Buffer.from([1]), mime: "image/jpeg", nome: "foto.jpg", legenda: "Treino" });
    expect(db.conversaMensageria.findFirst).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 1, unidadeId: 7 } }));
    expect(store.set).toHaveBeenCalledWith(expect.stringMatching(/^mensageria\/.+\.jpg$/), expect.any(Blob), expect.anything());
    expect(tx.mensagemMensageria.create).toHaveBeenCalledWith({ data: expect.objectContaining({ autor: "ATENDENTE", mediaStatus: "DISPONIVEL", arquivoMime: "image/jpeg", conteudo: "Treino" }) });
    expect(tx.leadEvento.create).toHaveBeenCalled();
  });

  it("não revela conversa de outra unidade", async () => {
    const { db } = banco(null); const store = { set: vi.fn() };
    await expect(new ArmazenarAnexoMensageriaService(db as never, store).executar({ conversaId: 1, unidadeId: 8, usuarioId: 5, buffer: Buffer.from([1]), mime: "image/jpeg", nome: "foto.jpg" })).rejects.toMatchObject({ statusCode: 404 });
    expect(store.set).not.toHaveBeenCalled();
  });

  it("bloqueia janela encerrada e documento no Instagram", async () => {
    const antiga = new Date(Date.now() - 25 * 60 * 60_000); const store = { set: vi.fn() };
    const whatsapp = banco(conversa("WHATSAPP", antiga));
    await expect(new ArmazenarAnexoMensageriaService(whatsapp.db as never, store).executar({ conversaId: 1, unidadeId: 7, usuarioId: 5, buffer: Buffer.from([1]), mime: "image/jpeg", nome: "foto.jpg" })).rejects.toThrow(/janela/i);
    const instagram = banco(conversa("INSTAGRAM"));
    await expect(new ArmazenarAnexoMensageriaService(instagram.db as never, store).executar({ conversaId: 1, unidadeId: 7, usuarioId: 5, buffer: Buffer.from([1]), mime: "application/pdf", nome: "doc.pdf" })).rejects.toThrow(/Instagram/i);
  });
});
