import { describe, expect, it } from "vitest";
import { codigoSeguroSnapshot } from "./EnviarSnapshotContagemService";

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
