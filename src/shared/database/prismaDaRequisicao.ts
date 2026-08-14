import { prisma } from "./prisma";
import { prismaDoContexto } from "../tenant/ContextoTenant";

export function prismaDaRequisicao() {
  try {
    return prismaDoContexto();
  } catch {
    if (process.env.TENANT_RESOLUTION_REQUIRED === "true") {
      throw new Error("CONTEXTO_TENANT_AUSENTE");
    }
    return prisma;
  }
}
