import type { PrismaClient } from "@prisma/client";
import { describe, expect, it, vi } from "vitest";
import type { SecretValueProvider, SecretWriteProvider } from "../../../shared/tenant/SecretValueProvider";
import type { ControlPlaneMensageriaClient } from "./ControlPlaneMensageriaClient";
import type { MetaOAuthProvider } from "./MetaOAuthProvider";
import { ManterCanaisMetaService } from "./ManterCanaisMetaService";

const expiraEm = new Date(Date.now() + 60 * 24 * 60 * 60_000);
const canal = {
  id: 1, unidadeId: 2, tipo: "INSTAGRAM", identificadorExterno: "ig-1", tokenRef: "cofre/token",
  proximaRenovacaoEm: new Date(Date.now() - 1_000), ultimoDiagnosticoEm: new Date(),
};

function dependencias(falhar = false) {
  const update = vi.fn().mockResolvedValue({});
  const db = { canalMensageria: { findMany: vi.fn().mockResolvedValue([canal]), update } } as unknown as PrismaClient;
  const leitura: SecretValueProvider = { obter: vi.fn().mockResolvedValue("token-atual") };
  const armazenar = vi.fn().mockResolvedValue(undefined);
  const escrita: SecretWriteProvider = { armazenar };
  const oauth = {
    renovarTokenInstagram: vi.fn().mockImplementation(async () => { if (falhar) throw new Error("temporário"); return { token: "token-novo", expiraEm }; }),
    validarConta: vi.fn().mockResolvedValue({ nomeExibicao: "Instagram" }), assinarWebhooksInstagram: vi.fn().mockResolvedValue(undefined),
  } as unknown as MetaOAuthProvider;
  const diretorio = { sincronizar: vi.fn() } as unknown as ControlPlaneMensageriaClient;
  return { db, leitura, escrita, oauth, diretorio, update, armazenar };
}

describe("manutenção automática dos canais Meta", () => {
  it("renova no mesmo segredo e incrementa a versão", async () => {
    const deps = dependencias();
    await expect(new ManterCanaisMetaService(deps.db, deps.leitura, deps.escrita, deps.oauth, deps.diretorio, "tenant").executar()).resolves.toEqual({ encontrados: 1, renovados: 1, diagnosticados: 0, falhas: 0 });
    expect(deps.armazenar).toHaveBeenCalledWith("cofre/token", "token-novo");
    expect(deps.update).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ tokenExpiraEm: expiraEm, tokenVersao: { increment: 1 }, codigoErroConexao: null }) }));
  });

  it("agenda retry sem desativar o canal numa falha transitória", async () => {
    const deps = dependencias(true);
    await expect(new ManterCanaisMetaService(deps.db, deps.leitura, deps.escrita, deps.oauth, deps.diretorio, "tenant").executar()).resolves.toEqual({ encontrados: 1, renovados: 0, diagnosticados: 0, falhas: 1 });
    expect(deps.armazenar).not.toHaveBeenCalled();
    expect(deps.update).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ codigoErroConexao: "META_RENOVACAO_FALHOU" }) }));
    expect(deps.update.mock.calls[0][0].data.ativo).toBeUndefined();
  });
});
