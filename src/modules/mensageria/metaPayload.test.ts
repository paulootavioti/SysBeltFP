import { describe, expect, it } from "vitest";
import { extrairIdentificadorConta, normalizarMensagensMeta } from "./metaPayload";

describe("payload dos webhooks Meta", () => {
  it("extrai a conta e normaliza mensagens WhatsApp sem usar dados do contato para resolver tenant", () => {
    const corpo = { entry: [{ changes: [{ value: {
      metadata: { phone_number_id: "phone-tenant-a" },
      contacts: [{ wa_id: "5511999990000", profile: { name: "Maria" } }],
      messages: [{ id: "wamid.1", from: "5511999990000", timestamp: "1787616000", type: "text", text: { body: "Olá" } }],
    } }] }] };
    expect(extrairIdentificadorConta("WHATSAPP", corpo)).toBe("phone-tenant-a");
    expect(normalizarMensagensMeta("WHATSAPP", corpo)).toEqual([
      expect.objectContaining({ eventoExternoId: "wamid.1", contatoExternoId: "5511999990000", contatoNome: "Maria", conteudo: "Olá", tipoConteudo: "TEXTO" }),
    ]);
  });

  it("extrai a conta do entry e normaliza mensagens Instagram", () => {
    const corpo = { entry: [{ id: "ig-tenant-b", messaging: [{
      sender: { id: "ig-user" }, timestamp: 1787616000000, message: { mid: "mid.1", text: "Quero uma aula" },
    }] }] };
    expect(extrairIdentificadorConta("INSTAGRAM", corpo)).toBe("ig-tenant-b");
    expect(normalizarMensagensMeta("INSTAGRAM", corpo)[0]).toMatchObject({
      eventoExternoId: "mid.1", contatoExternoId: "ig-user", conteudo: "Quero uma aula", tipoConteudo: "TEXTO",
    });
  });

  it("ignora notificações de status sem mensagem recebida", () => {
    const corpo = { entry: [{ changes: [{ value: { metadata: { phone_number_id: "phone-1" }, statuses: [{ id: "wamid.1" }] } }] }] };
    expect(normalizarMensagensMeta("WHATSAPP", corpo)).toEqual([]);
  });

  it("extrai referência, legenda e nome de documento do WhatsApp", () => {
    const corpo = { entry: [{ changes: [{ value: { metadata: { phone_number_id: "phone" }, messages: [{ id: "wamid.doc", from: "5511", timestamp: "1787616000", type: "document", document: { id: "media-doc", caption: "Contrato", filename: "contrato.pdf" } }] } }] }] };
    expect(normalizarMensagensMeta("WHATSAPP", corpo)[0]).toMatchObject({ tipoConteudo: "DOCUMENTO", conteudo: "Contrato", mediaExternaId: "media-doc", arquivoNome: "contrato.pdf" });
  });

  it("extrai URL de anexo do Instagram", () => {
    const corpo = { entry: [{ id: "ig", messaging: [{ sender: { id: "user" }, timestamp: 1787616000000, message: { mid: "mid.img", attachments: [{ type: "image", payload: { url: "https://scontent.cdninstagram.com/img.jpg" } }] } }] }] };
    expect(normalizarMensagensMeta("INSTAGRAM", corpo)[0]).toMatchObject({ tipoConteudo: "IMAGEM", mediaUrlOrigem: "https://scontent.cdninstagram.com/img.jpg" });
  });
});
