import { describe, expect, it, vi } from "vitest";
import { ErroEnvioMeta } from "../MetaEnvioProvider";
import { DespacharMensagensService } from "./DespacharMensagensService";

function mensagem() {
  return {
    id: 10, direcao: "SAIDA", statusEntrega: "PENDENTE", conteudo: "Olá", payload: null, tentativasEnvio: 0,
    conversa: { contatoExternoId: "5511999990000" },
    canalMensageria: { tipo: "WHATSAPP", identificadorExterno: "phone", tokenRef: "secret", ativo: true },
  };
}

describe("despacho confiável de mensagens", () => {
  it("agenda nova tentativa para falha transitória", async () => {
    const db = { mensagemMensageria: { findUnique: vi.fn().mockResolvedValue(mensagem()), updateMany: vi.fn().mockResolvedValue({ count: 1 }), update: vi.fn().mockResolvedValue({}) } };
    const provedor = { enviar: vi.fn().mockRejectedValue(new ErroEnvioMeta("META_HTTP_503", true)) };
    const segredos = { obter: vi.fn().mockResolvedValue("token") };
    expect(await new DespacharMensagensService(db as never, provedor as never, segredos).enviarMensagem(10)).toBe(false);
    expect(db.mensagemMensageria.update).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({
      statusEntrega: "FALHOU", erroEnvio: "META_HTTP_503", tentativasEnvio: 1, proximaTentativaEm: expect.any(Date),
    }) }));
  });

  it("não repete texto recusado por janela encerrada", async () => {
    const db = { mensagemMensageria: { findUnique: vi.fn().mockResolvedValue(mensagem()), updateMany: vi.fn().mockResolvedValue({ count: 1 }), update: vi.fn().mockResolvedValue({}) } };
    const provedor = { enviar: vi.fn().mockRejectedValue(new ErroEnvioMeta("META_JANELA_24H_ENCERRADA", false)) };
    const segredos = { obter: vi.fn().mockResolvedValue("token") };
    await new DespacharMensagensService(db as never, provedor as never, segredos).enviarMensagem(10);
    expect(db.mensagemMensageria.update).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ proximaTentativaEm: null }) }));
  });

  it("despacha template persistido sem enviar a prévia como texto", async () => {
    const template = { ...mensagem(), conteudo: "Prévia", payload: { template: { nome: "retomar", idioma: "pt_BR" } } };
    const db = { mensagemMensageria: { findUnique: vi.fn().mockResolvedValue(template), updateMany: vi.fn().mockResolvedValue({ count: 1 }), update: vi.fn().mockResolvedValue({}) } };
    const provedor = { enviar: vi.fn().mockResolvedValue("wamid.ok") };
    const segredos = { obter: vi.fn().mockResolvedValue("token") };
    expect(await new DespacharMensagensService(db as never, provedor as never, segredos).enviarMensagem(10)).toBe(true);
    expect(provedor.enviar).toHaveBeenCalledWith(expect.objectContaining({ texto: undefined, template: { nome: "retomar", idioma: "pt_BR" } }));
  });

  it("não envia quando outra execução já reservou a mensagem", async () => {
    const db = { mensagemMensageria: { findUnique: vi.fn().mockResolvedValue(mensagem()), updateMany: vi.fn().mockResolvedValue({ count: 0 }), update: vi.fn() } };
    const provedor = { enviar: vi.fn() }; const segredos = { obter: vi.fn() };
    expect(await new DespacharMensagensService(db as never, provedor as never, segredos).enviarMensagem(10)).toBe(false);
    expect(provedor.enviar).not.toHaveBeenCalled();
  });

  it("entrega anexo por URL pública assinada", async () => {
    const anteriorUrl = process.env.PUBLIC_API_URL; const anteriorJwt = process.env.JWT_SECRET;
    process.env.PUBLIC_API_URL = "https://app.sysbelt.com.br/api"; process.env.JWT_SECRET = "segredo-de-teste-com-tamanho-suficiente";
    try {
      const anexo = { ...mensagem(), conteudo: "Legenda", tipoConteudo: "IMAGEM", arquivoUrl: "/uploads/mensageria/foto.jpg", arquivoNome: "foto.jpg", proximaTentativaEm: null };
      const db = { mensagemMensageria: { findUnique: vi.fn().mockResolvedValue(anexo), updateMany: vi.fn().mockResolvedValue({ count: 1 }), update: vi.fn().mockResolvedValue({}) } };
      const provedor = { enviar: vi.fn().mockResolvedValue("wamid.img") }; const segredos = { obter: vi.fn().mockResolvedValue("token") };
      expect(await new DespacharMensagensService(db as never, provedor as never, segredos).enviarMensagem(10)).toBe(true);
      expect(provedor.enviar).toHaveBeenCalledWith(expect.objectContaining({ texto: undefined, media: expect.objectContaining({ tipo: "IMAGEM", legenda: "Legenda", url: expect.stringMatching(/^https:\/\/app\.sysbelt\.com\.br\/api\/uploads\/mensageria\/foto\.jpg\?exp=.+&sig=.+/) }) }));
    } finally { if (anteriorUrl === undefined) delete process.env.PUBLIC_API_URL; else process.env.PUBLIC_API_URL = anteriorUrl; if (anteriorJwt === undefined) delete process.env.JWT_SECRET; else process.env.JWT_SECRET = anteriorJwt; }
  });
});
