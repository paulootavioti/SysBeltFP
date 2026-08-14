import { AsyncLocalStorage } from "node:async_hooks";
import type { PrismaClient } from "@prisma/client";

export interface ContextoTenant {
  tenantKey: string;
  slug: string;
  prisma: PrismaClient;
  requestId: string;
  schemaVersion: string;
}

const armazenamentoTenant = new AsyncLocalStorage<ContextoTenant>();

export class ContextoTenantAusenteError extends Error {
  constructor() { super("CONTEXTO_TENANT_AUSENTE"); }
}

export function comContextoTenant<T>(contexto: ContextoTenant, acao: () => T): T {
  return armazenamentoTenant.run(Object.freeze({ ...contexto }), acao);
}

export function obterContextoTenant(): ContextoTenant {
  const contexto = armazenamentoTenant.getStore();
  if (!contexto) throw new ContextoTenantAusenteError();
  return contexto;
}

export function prismaDoContexto(): PrismaClient {
  return obterContextoTenant().prisma;
}

export function tenantKeyDoContexto(): string {
  return obterContextoTenant().tenantKey;
}
