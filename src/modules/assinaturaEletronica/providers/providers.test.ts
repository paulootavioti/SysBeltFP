import { describe, expect, it } from "vitest";

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
    new AutentiqueProvider(),
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
