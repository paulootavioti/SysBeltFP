import { randomUUID } from "node:crypto";
import type { NextFunction, Request, Response } from "express";

import { comContextoTenant } from "./ContextoTenant";
import type { TenantDirectory } from "./TenantDirectory";
import { TenantDirectoryIndisponivelError } from "./TenantDirectory";
import { extrairSlugTenant, HostTenantInvalidoError } from "./TenantHostParser";
import type { TenantPrismaRegistry } from "./TenantPrismaRegistry";
import type { TenantSecretProvider } from "./TenantSecretProvider";
import { SegredoTenantIndisponivelError } from "./TenantSecretProvider";

export interface DependenciasResolucaoTenant {
  dominioBase: string;
  desenvolvimento?: boolean;
  diretorio: TenantDirectory;
  segredos: TenantSecretProvider;
  registro: TenantPrismaRegistry;
  versoesSchemaCompativeis?: ReadonlySet<string>;
}

export function criarResolucaoTenantMiddleware(deps: DependenciasResolucaoTenant) {
  return async (request: Request, response: Response, next: NextFunction) => {
    try {
      const slug = extrairSlugTenant(request.hostname, {
        dominioBase: deps.dominioBase,
        desenvolvimento: deps.desenvolvimento,
      });
      const tenant = await deps.diretorio.resolver(slug);
      if (!tenant) return response.status(404).json({ mensagem: "Ambiente não encontrado." });
      if (tenant.status === "SUSPENSO") {
        return response.status(403).json({ mensagem: "Acesso temporariamente suspenso." });
      }
      if (deps.versoesSchemaCompativeis && !deps.versoesSchemaCompativeis.has(tenant.schemaVersion)) {
        return response.status(503).json({ mensagem: "Ambiente temporariamente indisponível." });
      }
      const prisma = await deps.registro.obter({
        tenantKey: tenant.tenantKey,
        credentialVersion: tenant.credentialVersion,
      }, async () => (await deps.segredos.obter(
        tenant.secretRef, tenant.tenantKey, tenant.credentialVersion,
      )).pooledUrl);
      return comContextoTenant({
        tenantKey: tenant.tenantKey,
        slug: tenant.slug,
        prisma,
        requestId: randomUUID(),
        schemaVersion: tenant.schemaVersion,
      }, next);
    } catch (erro) {
      if (erro instanceof HostTenantInvalidoError) {
        return response.status(404).json({ mensagem: "Ambiente não encontrado." });
      }
      if (erro instanceof TenantDirectoryIndisponivelError || erro instanceof SegredoTenantIndisponivelError) {
        return response.status(503).json({ mensagem: "Ambiente temporariamente indisponível." });
      }
      return next(erro);
    }
  };
}
