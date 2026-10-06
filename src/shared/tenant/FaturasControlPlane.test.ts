import { afterEach, describe, expect, it, vi } from "vitest";
import { listarFaturasControlPlane } from "./FaturasControlPlane";

afterEach(() => vi.unstubAllEnvs());

describe("faturas comerciais do Control Plane", () => {
  it("consulta pelo host mapeado e pela credencial do produto", async () => {
    vi.stubEnv("CONTROL_PLANE_DIRECTORY_MULTIPRODUCT_ENABLED", "true");
    vi.stubEnv("CONTROL_PLANE_URL", "https://control.test");
    vi.stubEnv("CONTROL_PLANE_SYSBELT_CREDENTIAL", "credencial");
    vi.stubEnv("CONTROL_PLANE_CREDENTIAL_VERSION", "v1");
    vi.stubEnv("SYSBELT_TENANT_HOST_MAP", JSON.stringify({ "sysbeltfp.netlify.app": "academia-centro" }));
    const fatura = {
      id: "aff2170f-61b1-4e7a-b483-a8a353ee422f", competencia: "2026-09",
      vencimento: "2026-09-10T00:00:00.000Z", status: "PAGA",
      alunosContados: 8, alunosPorBloco: 10, blocos: 1,
      precoPorBlocoCentavos: 1000, valorCentavos: 1000,
      pagaEm: "2026-09-13T22:00:00.000Z", detalhamentoUnidades: [],
    };
    const fetchFn = vi.fn().mockResolvedValue(new Response(JSON.stringify([fatura]), { status: 200 }));
    await expect(listarFaturasControlPlane("sysbeltfp.netlify.app", fetchFn)).resolves.toEqual([fatura]);
    expect(fetchFn).toHaveBeenCalledWith(new URL("https://control.test/api/diretorio/v1/produtos/sysbelt/tenants/academia-centro/faturas"), expect.objectContaining({ headers: expect.objectContaining({ authorization: "Bearer credencial" }) }));
  });
});
