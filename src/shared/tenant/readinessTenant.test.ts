import { describe, expect, it } from "vitest";
import { obterReadinessTenant } from "./readinessTenant";

const completa = {
  TENANT_APP_BASE_DOMAIN: "app.sysbelt.com.br",
  CONTROL_PLANE_URL: "https://control.example.com",
  TENANT_DIRECTORY_SECRET: "s".repeat(32),
  AWS_REGION: "sa-east-1",
  NODE_ENV: "production",
  TENANT_SCHEMA_COMPATIBLE_VERSIONS: "schema-1",
};

describe("readiness da resolução tenant", () => {
  it("mantém legado saudável e informa se está pronto para ativar", () => {
    expect(obterReadinessTenant(completa)).toEqual({
      httpStatus: 200,
      corpo: expect.objectContaining({ status: "legacy", habilitada: false, prontaParaAtivar: true }),
    });
  });

  it("retorna 503 quando habilitada sem configuração completa", () => {
    expect(obterReadinessTenant({ TENANT_RESOLUTION_ENABLED: "true" })).toEqual({
      httpStatus: 503,
      corpo: expect.objectContaining({ status: "not_ready", configuracaoValida: false, awsConfigurada: false }),
    });
  });

  it("não inclui valores de URL, segredo, região ou domínio no corpo", () => {
    const resultado = obterReadinessTenant({ ...completa, TENANT_RESOLUTION_ENABLED: "true" });
    expect(resultado.httpStatus).toBe(200);
    const serializado = JSON.stringify(resultado.corpo);
    expect(serializado).not.toContain("control.example.com");
    expect(serializado).not.toContain("sa-east-1");
    expect(serializado).not.toContain("app.sysbelt.com.br");
    expect(serializado).not.toContain("s".repeat(32));
  });
});
