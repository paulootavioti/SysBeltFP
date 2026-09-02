import type { PrismaClient } from "@prisma/client";
import { describe, expect, it, vi } from "vitest";
import { SincronizarMensageriaService } from "./SincronizarMensageriaService";

const dados = { tenantKey: "11111111-1111-4111-8111-111111111111", tipo: "WHATSAPP" as const, identificadorExterno: "phone-123", appSecretRef: "cofre/app-secret", ativo: true };

function banco(assinanteExistente = "assinante-1") {
  const upsert = vi.fn().mockResolvedValue({ id: "conta-1", atualizadoEm: new Date() });
  const db = {
    ambienteTenant: { findUnique: vi.fn().mockResolvedValue({ assinanteId: "assinante-1" }) },
    contaMensageriaDiretorio: {
      findUnique: vi.fn().mockResolvedValue(assinanteExistente ? { id: "conta-1", assinanteId: assinanteExistente } : null),
      upsert,
    },
  } as unknown as PrismaClient;
  return { db, upsert };
}

describe("sincronização do diretório de mensageria", () => {
  it("faz upsert idempotente para o mesmo tenant", async () => {
    const { db, upsert } = banco();
    await new SincronizarMensageriaService(db).execute(dados);
    expect(upsert).toHaveBeenCalledWith(expect.objectContaining({ update: expect.objectContaining({ ativo: true, appSecretRef: dados.appSecretRef }) }));
  });

  it("bloqueia apropriação de conta vinculada a outro tenant", async () => {
    const { db, upsert } = banco("assinante-2");
    await expect(new SincronizarMensageriaService(db).execute(dados)).rejects.toThrow("CONTA_MENSAGERIA_EM_USO");
    expect(upsert).not.toHaveBeenCalled();
  });
});
