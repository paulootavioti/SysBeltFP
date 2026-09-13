import { afterEach, describe, expect, it } from "vitest";
import { chavePrivadaDeSnapshot, codigoSeguroSnapshot } from "./EnviarSnapshotContagemService";

afterEach(() => {
  delete process.env.TENANT_INTEGRATION_PRIVATE_KEY;
  delete process.env.TENANT_INTEGRATION_PRIVATE_KEY_BASE64;
});

describe("diagnóstico sanitizado do snapshot", () => {
  it.each([
    ["TENANT_INTEGRATION_PRIVATE_KEY não configurada.", "CHAVE_PRIVADA_AUSENTE"],
    ["CONTROL_PLANE_URL não configurada.", "URL_CONTROL_PLANE_AUSENTE"],
    ["CHAVE_PRIVADA_INVALIDA", "CHAVE_PRIVADA_INVALIDA"],
    ["Conta sem unidades; snapshot não enviado.", "CONTA_SEM_UNIDADES"],
    ["Control Plane recusou snapshot com status 401.", "CONTROL_PLANE_HTTP_401"],
  ])("converte %s em %s", (mensagem, codigo) => {
    expect(codigoSeguroSnapshot(new Error(mensagem))).toBe(codigo);
  });

  it("não expõe mensagens inesperadas", () => {
    expect(codigoSeguroSnapshot(new Error("postgres://segredo"))).toBe("FALHA_NO_SNAPSHOT");
  });
});

describe("leitura da chave privada de snapshot", () => {
  it("prioriza e decodifica a variável Base64 de linha única", () => {
    const pem = "-----BEGIN PRIVATE KEY-----\nconteudo\n-----END PRIVATE KEY-----";
    process.env.TENANT_INTEGRATION_PRIVATE_KEY_BASE64 = Buffer.from(pem).toString("base64");
    process.env.TENANT_INTEGRATION_PRIVATE_KEY = "valor-antigo";
    expect(chavePrivadaDeSnapshot()).toBe(pem);
  });

  it("recusa Base64 que não produza um PEM privado", () => {
    process.env.TENANT_INTEGRATION_PRIVATE_KEY_BASE64 = Buffer.from("invalida").toString("base64");
    expect(() => chavePrivadaDeSnapshot()).toThrow("CHAVE_PRIVADA_INVALIDA");
  });
});
