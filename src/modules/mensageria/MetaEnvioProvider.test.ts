import { describe, expect, it, vi } from "vitest";
import { MetaEnvioProvider } from "./MetaEnvioProvider";

describe("envio pela Meta", () => {
  it("envia texto pelo WhatsApp Cloud API e retorna o id do provedor", async () => {
    const fetchFn = vi.fn().mockResolvedValue(new Response(JSON.stringify({ messages: [{ id: "wamid.enviada" }] }), { status: 200 }));
    const id = await new MetaEnvioProvider(fetchFn, "v23.0").enviar({
      tipo: "WHATSAPP", identificadorConta: "phone-1", contatoExternoId: "5511999990000", texto: "Olá", token: "token-secreto",
    });
    expect(id).toBe("wamid.enviada");
    expect(fetchFn).toHaveBeenCalledWith("https://graph.facebook.com/v23.0/phone-1/messages", expect.objectContaining({
      method: "POST", headers: expect.objectContaining({ authorization: "Bearer token-secreto" }),
      body: expect.stringContaining('"messaging_product":"whatsapp"'),
    }));
  });

  it("envia texto pelo Instagram e não inclui campos do WhatsApp", async () => {
    const fetchFn = vi.fn().mockResolvedValue(new Response(JSON.stringify({ message_id: "ig-mid-1" }), { status: 200 }));
    const id = await new MetaEnvioProvider(fetchFn).enviar({
      tipo: "INSTAGRAM", identificadorConta: "ig-account", contatoExternoId: "igsid", texto: "Olá", token: "token",
    });
    expect(id).toBe("ig-mid-1");
    expect(fetchFn.mock.calls[0][0]).toBe("https://graph.instagram.com/v23.0/ig-account/messages");
    const corpo = JSON.parse(fetchFn.mock.calls[0][1].body);
    expect(corpo).toEqual({ recipient: { id: "igsid" }, message: { text: "Olá" } });
  });

  it("expõe somente o código HTTP quando a Meta recusa", async () => {
    const fetchFn = vi.fn().mockResolvedValue(new Response(JSON.stringify({ error: { message: "conteúdo sensível" } }), { status: 429 }));
    await expect(new MetaEnvioProvider(fetchFn).enviar({
      tipo: "WHATSAPP", identificadorConta: "phone", contatoExternoId: "contato", texto: "mensagem", token: "token",
    })).rejects.toThrow("META_HTTP_429");
  });

  it("classifica janela de 24 horas encerrada sem expor a mensagem da Meta", async () => {
    const fetchFn = vi.fn().mockResolvedValue(new Response(JSON.stringify({ error: { code: 131047, message: "telefone e conteúdo sensível" } }), { status: 400 }));
    await expect(new MetaEnvioProvider(fetchFn).enviar({
      tipo: "WHATSAPP", identificadorConta: "phone", contatoExternoId: "contato", texto: "mensagem", token: "token",
    })).rejects.toMatchObject({ message: "META_JANELA_24H_ENCERRADA", transitorio: false });
  });

  it("envia template aprovado pelo WhatsApp", async () => {
    const fetchFn = vi.fn().mockResolvedValue(new Response(JSON.stringify({ messages: [{ id: "wamid.template" }] }), { status: 200 }));
    await new MetaEnvioProvider(fetchFn).enviar({
      tipo: "WHATSAPP", identificadorConta: "phone", contatoExternoId: "contato", template: { nome: "retomar_atendimento", idioma: "pt_BR", parametros: ["Paulo"] }, token: "token",
    });
    expect(JSON.parse(fetchFn.mock.calls[0][1].body)).toMatchObject({
      type: "template", template: { name: "retomar_atendimento", language: { code: "pt_BR" }, components: [{ type: "body", parameters: [{ type: "text", text: "Paulo" }] }] },
    });
  });

  it("envia documento com link, legenda e nome pelo WhatsApp", async () => {
    const fetchFn = vi.fn().mockResolvedValue(new Response(JSON.stringify({ messages: [{ id: "wamid.doc" }] }), { status: 200 }));
    await new MetaEnvioProvider(fetchFn).enviar({ tipo: "WHATSAPP", identificadorConta: "phone", contatoExternoId: "contato", token: "token", media: { tipo: "DOCUMENTO", url: "https://api.sysbelt.com/uploads/doc?sig=x", nome: "contrato.pdf", legenda: "Contrato" } });
    expect(JSON.parse(fetchFn.mock.calls[0][1].body)).toMatchObject({ type: "document", document: { link: expect.stringContaining("/uploads/doc"), filename: "contrato.pdf", caption: "Contrato" } });
  });

  it("envia imagem pelo Instagram e bloqueia documento", async () => {
    const fetchFn = vi.fn().mockResolvedValue(new Response(JSON.stringify({ message_id: "ig.img" }), { status: 200 }));
    const provider = new MetaEnvioProvider(fetchFn);
    await provider.enviar({ tipo: "INSTAGRAM", identificadorConta: "ig", contatoExternoId: "user", token: "token", media: { tipo: "IMAGEM", url: "https://api.sysbelt.com/uploads/img" } });
    expect(JSON.parse(fetchFn.mock.calls[0][1].body)).toEqual({ recipient: { id: "user" }, message: { attachment: { type: "image", payload: { url: "https://api.sysbelt.com/uploads/img" } } } });
    await expect(provider.enviar({ tipo: "INSTAGRAM", identificadorConta: "ig", contatoExternoId: "user", token: "token", media: { tipo: "DOCUMENTO", url: "https://api/doc" } })).rejects.toThrow("META_MEDIA_CANAL_INVALIDO");
  });
});
