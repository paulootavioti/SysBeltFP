import { describe, expect, it, vi } from "vitest";
import type { PrismaClient } from "@prisma/client";
import { ResolverMensageriaService } from "./ResolverMensageriaService";

describe("diretório de mensageria", () => {
  it("resolve exclusivamente pelo tipo e identificador técnico e devolve apenas referências", async () => {
    const findFirst = vi.fn().mockResolvedValue({
      appSecretRef: "secret/meta/app-a",
      assinante: { slug: "academia-a", ambiente: {
        tenantKey: "11111111-1111-4111-8111-111111111111", status: "ATIVO",
      } },
    });
    const db = { contaMensageriaDiretorio: { findFirst } } as unknown as PrismaClient;
    const resultado = await new ResolverMensageriaService(db).execute("WHATSAPP", "phone-a");
    expect(findFirst).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ tipo: "WHATSAPP", identificadorExterno: "phone-a", ativo: true }),
    }));
    expect(resultado).toEqual({
      tenantKey: "11111111-1111-4111-8111-111111111111", slug: "academia-a", status: "ATIVO",
      appSecretRef: "secret/meta/app-a",
    });
    expect(resultado).not.toHaveProperty("token");
  });

  it("não retorna ambiente para conta externa desconhecida", async () => {
    const db = { contaMensageriaDiretorio: { findFirst: vi.fn().mockResolvedValue(null) } } as unknown as PrismaClient;
    await expect(new ResolverMensageriaService(db).execute("INSTAGRAM", "ig-inexistente"))
      .rejects.toThrow("CONTA_MENSAGERIA_NAO_ENCONTRADA");
  });
});
