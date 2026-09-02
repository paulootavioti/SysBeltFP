import type { PrismaClient } from "@prisma/client";
import { describe, expect, it, vi } from "vitest";
import type { SecretValueProvider } from "../../../shared/tenant/SecretValueProvider";
import type { ControlPlaneMensageriaClient } from "./ControlPlaneMensageriaClient";
import type { MetaOAuthProvider } from "./MetaOAuthProvider";
import { DiagnosticarCanalMetaService } from "./DiagnosticarCanalMetaService";

const canal = {
  id: 10, unidadeId: 20, tipo: "INSTAGRAM" as const, identificadorExterno: "ig-123", tokenRef: "cofre/token",
  nomeExibicao: "Instagram", verifyTokenRef: "cofre/verify", canalCaptacaoId: null, ativo: true,
  statusConexao: "CONECTADO" as const, codigoErroConexao: null, validadoEm: null, sincronizadoEm: null,
  criadoEm: new Date(), atualizadoEm: new Date(),
};

function dependencias(falhar = false) {
  const update = vi.fn().mockImplementation(({ data }) => Promise.resolve({ ...canal, ...data }));
  const db = { canalMensageria: { findFirst: vi.fn().mockResolvedValue(canal), update } } as unknown as PrismaClient;
  const segredos: SecretValueProvider = { obter: vi.fn().mockResolvedValue("token") };
  const oauth = {
    validarConta: vi.fn().mockImplementation(async () => { if (falhar) throw new Error("META_TOKEN_INVALIDO"); return { nomeExibicao: "Instagram" }; }),
    assinarWebhooksInstagram: vi.fn().mockResolvedValue(undefined),
  } as unknown as MetaOAuthProvider;
  const sincronizar = vi.fn().mockResolvedValue(undefined);
  const diretorio = { sincronizar } as unknown as ControlPlaneMensageriaClient;
  return { db, segredos, oauth, diretorio, update, sincronizar };
}

describe("diagnóstico de canal Meta", () => {
  it("valida o canal dentro da unidade e renova a assinatura", async () => {
    process.env.META_INSTAGRAM_APP_SECRET_REF = "cofre/app-instagram";
    const deps = dependencias();
    await new DiagnosticarCanalMetaService(deps.db, deps.segredos, deps.oauth, deps.diretorio, "tenant-key").executar(20, 10);
    expect((deps.db.canalMensageria.findFirst as ReturnType<typeof vi.fn>)).toHaveBeenCalledWith({ where: { id: 10, unidadeId: 20 } });
    expect(deps.sincronizar).toHaveBeenCalledWith(expect.objectContaining({ ativo: true, identificadorExterno: "ig-123" }));
    expect(deps.update).toHaveBeenLastCalledWith(expect.objectContaining({ data: expect.objectContaining({ ativo: true, statusConexao: "CONECTADO" }) }));
  });

  it("inativa o canal e o diretório quando o token é inválido", async () => {
    process.env.META_INSTAGRAM_APP_SECRET_REF = "cofre/app-instagram";
    const deps = dependencias(true);
    await expect(new DiagnosticarCanalMetaService(deps.db, deps.segredos, deps.oauth, deps.diretorio, "tenant-key").executar(20, 10)).rejects.toMatchObject({ statusCode: 422 });
    expect(deps.sincronizar).toHaveBeenCalledWith(expect.objectContaining({ ativo: false }));
    expect(deps.update).toHaveBeenLastCalledWith(expect.objectContaining({ data: expect.objectContaining({ ativo: false, statusConexao: "ERRO", codigoErroConexao: "META_TOKEN_INVALIDO" }) }));
  });
});
