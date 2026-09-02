import { afterEach, describe, expect, it, vi } from "vitest";

import { obterProvedorAssinatura, ProvedorAssinaturaNaoImplementadoError } from "./index";
import { NullElectronicSignatureProvider } from "./NullElectronicSignatureProvider";
import { ClicksignProvider } from "./ClicksignProvider";
import { D4SignProvider } from "./D4SignProvider";
import { AutentiqueProvider } from "./AutentiqueProvider";
import { DocuSignProvider } from "./DocuSignProvider";
import { AdobeSignProvider } from "./AdobeSignProvider";

describe("obterProvedorAssinatura", () => {
  it("retorna o provedor manual quando nenhum nome é informado", () => {
    expect(obterProvedorAssinatura()).toBeInstanceOf(NullElectronicSignatureProvider);
    expect(obterProvedorAssinatura(null)).toBeInstanceOf(NullElectronicSignatureProvider);
  });

  it("retorna o provedor manual pra um nome desconhecido", () => {
    expect(obterProvedorAssinatura("PROVEDOR_INEXISTENTE")).toBeInstanceOf(NullElectronicSignatureProvider);
  });

  it.each([
    ["CLICKSIGN", ClicksignProvider],
    ["D4SIGN", D4SignProvider],
    ["AUTENTIQUE", AutentiqueProvider],
    ["DOCUSIGN", DocuSignProvider],
    ["ADOBE_SIGN", AdobeSignProvider],
  ] as const)("resolve %s pra sua classe concreta", (nome, Classe) => {
    expect(obterProvedorAssinatura(nome)).toBeInstanceOf(Classe);
  });
});

describe("NullElectronicSignatureProvider", () => {
  const provider = new NullElectronicSignatureProvider();

  it("simula o envio manual pra assinatura", async () => {
    const resultado = await provider.enviarParaAssinatura({
      conteudo: "texto do contrato",
      signatarios: [{ nome: "Aluno Teste" }],
      referenciaExterna: "1",
    });

    expect(resultado.status).toBe("AGUARDANDO_ASSINATURA_MANUAL");
    expect(resultado.provedorDocumentoId).toMatch(/^manual-/);
  });

  it("lança ao tentar baixar o documento assinado (fluxo manual não tem isso)", async () => {
    await expect(provider.baixarDocumentoAssinado()).rejects.toThrow();
  });
});

describe("Provedores ainda não implementados", () => {
  it.each([
    new ClicksignProvider(),
    new D4SignProvider(),
    new DocuSignProvider(),
    new AdobeSignProvider(),
  ])("$nome lança ProvedorAssinaturaNaoImplementadoError em todos os métodos", async (provedor) => {
    await expect(
      provedor.enviarParaAssinatura({ conteudo: "x", signatarios: [], referenciaExterna: "1" })
    ).rejects.toThrow(ProvedorAssinaturaNaoImplementadoError);
    await expect(provedor.consultarStatus("x")).rejects.toThrow(ProvedorAssinaturaNaoImplementadoError);
    await expect(provedor.cancelarSolicitacao("x")).rejects.toThrow(ProvedorAssinaturaNaoImplementadoError);
    await expect(provedor.baixarDocumentoAssinado("x")).rejects.toThrow(ProvedorAssinaturaNaoImplementadoError);
    await expect(provedor.processarWebhook({})).rejects.toThrow(ProvedorAssinaturaNaoImplementadoError);
  });
});

describe("AutentiqueProvider", () => {
  afterEach(() => vi.restoreAllMocks());

  it("envia o HTML e devolve o link do signatário", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify({
      data: { createDocument: { id: "doc-1", signatures: [{ link: { short_link: "https://a.test/assinar" } }] } },
    }), { status: 200, headers: { "Content-Type": "application/json" } }));
    const provider = new AutentiqueProvider("token-teste");
    const resultado = await provider.enviarParaAssinatura({
      conteudo: "Contrato <seguro>",
      signatarios: [{ nome: "Maria", email: "maria@example.com", cpf: "123" }],
      referenciaExterna: "42",
    });

    expect(resultado).toEqual({ provedorDocumentoId: "doc-1", linkAssinatura: "https://a.test/assinar", status: "PENDENTE" });
    expect(fetchMock).toHaveBeenCalledOnce();
    const requisicao = fetchMock.mock.calls[0][1];
    expect(requisicao?.headers).toMatchObject({ Authorization: "Bearer token-teste" });
    expect(requisicao?.body).toBeInstanceOf(FormData);
  });

  it("interpreta o evento de documento concluído", async () => {
    const evento = await new AutentiqueProvider("token").processarWebhook({
      event: { type: "document.finished", data: { object: { id: "doc-2" } } },
    });
    expect(evento.tipo).toBe("document.finished");
    expect(evento.referenciaExterna).toBe("doc-2");
  });
});
