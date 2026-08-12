import { generateKeyPairSync, sign } from "node:crypto";
import { describe, expect, it } from "vitest";

import { ConcessaoV1, payloadConcessao, validarConcessao } from "./concessaoContrato";

const { publicKey, privateKey } = generateKeyPairSync("ed25519");
const tenantKey = "64d729dc-8cbc-4fbf-9259-f28809faf55d";

function assinada(): ConcessaoV1 {
  const base: ConcessaoV1 = {
    versao: 1, tenantKey, revisao: 1, statusAcesso: "ATIVO", recursos: ["WHATSAPP"],
    emitidaEm: "2026-08-12T12:00:00.000Z", expiraEm: "2026-08-13T12:00:00.000Z", assinatura: "",
  };
  return { ...base, assinatura: sign(null, Buffer.from(payloadConcessao(base)), privateKey).toString("base64") };
}

describe("concessão assinada", () => {
  it("aceita concessão válida do tenant esperado", () => {
    expect(validarConcessao(
      assinada(), tenantKey, publicKey.export({ type: "spki", format: "pem" }).toString(),
      new Date("2026-08-12T13:00:00.000Z"),
    ).payloadHash).toHaveLength(64);
  });

  it("recusa adulteração, outro tenant e expiração", () => {
    const concessao = assinada();
    const publica = publicKey.export({ type: "spki", format: "pem" }).toString();
    expect(() => validarConcessao({ ...concessao, recursos: ["CONTROLE_ACESSO"] }, tenantKey, publica, new Date("2026-08-12T13:00:00Z"))).toThrow("Assinatura");
    expect(() => validarConcessao(concessao, "b4b7db40-bfa0-4f8f-8228-d7ce75501287", publica, new Date("2026-08-12T13:00:00Z"))).toThrow("outro tenant");
    expect(() => validarConcessao(concessao, tenantKey, publica, new Date("2026-08-14T00:00:00Z"))).toThrow("expirada");
  });
});
