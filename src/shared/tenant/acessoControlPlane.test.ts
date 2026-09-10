import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AppError } from "../errors/AppError";

const findUnique = vi.fn();
vi.mock("../database/prismaDaRequisicao", () => ({
  prismaDaRequisicao: () => ({ concessaoPlataforma: { findUnique } }),
}));

import { exigirAcessoControlPlane, limparClienteDiretorioParaTeste } from "./acessoControlPlane";

const tenantKey = "64d729dc-8cbc-4fbf-9259-f28809faf55d";
const tenant = {
  schemaVersion: "1.0",
  tenantKey,
  produto: "sysbelt",
  slug: "academia-centro",
  status: "ATIVO",
  acesso: { administrativo: "LIBERADO", clinico: "LIBERADO" },
  secretRef: "cofre/ref",
  tenantSchemaVersion: "3.0.2026.09.01",
  credentialVersion: 1,
};

function resposta(status: number, corpo: unknown = {}) {
  return { status, ok: status >= 200 && status < 300, json: vi.fn().mockResolvedValue(corpo) } as unknown as Response;
}

describe("controle de acesso pelo diretório multiproduto", () => {
  beforeEach(() => {
    vi.stubEnv("CONTROL_PLANE_DIRECTORY_MULTIPRODUCT_ENABLED", "true");
    vi.stubEnv("CONTROL_PLANE_URL", "https://control.test");
    vi.stubEnv("CONTROL_PLANE_SYSBELT_CREDENTIAL", "credencial");
    vi.stubEnv("CONTROL_PLANE_CREDENTIAL_VERSION", "v1");
    vi.stubEnv("SYSBELT_TENANT_DOMAINS", "app.sysbelt.com.br");
    vi.stubEnv("SYSBELT_TENANT_HOST_MAP", "");
    findUnique.mockReset();
    limparClienteDiretorioParaTeste();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
    limparClienteDiretorioParaTeste();
  });

  it("recusa resposta pertencente a outra conta", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(resposta(200, { ...tenant, tenantKey: "0f0e43bc-ab1d-456a-af9a-769a649f5b5d" })));
    const erro = await exigirAcessoControlPlane("academia-centro.app.sysbelt.com.br", tenantKey).catch((item) => item);
    expect(erro).toBeInstanceOf(AppError);
    expect(erro.statusCode).toBe(404);
  });

  it("aceita host Netlify configurado explicitamente", async () => {
    vi.stubEnv("SYSBELT_TENANT_HOST_MAP", JSON.stringify({ "sysbeltfp.netlify.app": "academia-centro" }));
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(resposta(200, tenant)));
    await expect(exigirAcessoControlPlane("sysbeltfp.netlify.app", tenantKey)).resolves.toBeUndefined();
  });

  it("bloqueia tenant suspenso", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(resposta(200, {
      ...tenant,
      status: "SUSPENSO_FINANCEIRO",
      acesso: { ...tenant.acesso, administrativo: "RESTRITO_REGULARIZACAO" },
    })));
    const erro = await exigirAcessoControlPlane("academia-centro.app.sysbelt.com.br", tenantKey).catch((item) => item);
    expect(erro).toBeInstanceOf(AppError);
    expect(erro.statusCode).toBe(403);
  });

  it("usa concessão local válida somente quando o diretório está indisponível", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
    findUnique.mockResolvedValue({ statusAcesso: "ATIVO", expiraEm: new Date("2026-09-10T00:00:00Z") });
    await expect(exigirAcessoControlPlane("academia-centro.app.sysbelt.com.br", tenantKey, new Date("2026-09-09T00:00:00Z"))).resolves.toBeUndefined();
  });

  it("falha fechado se diretório e concessão local válida não estiverem disponíveis", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
    findUnique.mockResolvedValue({ statusAcesso: "ATIVO", expiraEm: new Date("2026-09-08T00:00:00Z") });
    const erro = await exigirAcessoControlPlane("academia-centro.app.sysbelt.com.br", tenantKey, new Date("2026-09-09T00:00:00Z")).catch((item) => item);
    expect(erro).toBeInstanceOf(AppError);
    expect(erro.statusCode).toBe(503);
  });
});
