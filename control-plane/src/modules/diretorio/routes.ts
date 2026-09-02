import { Router } from "express";
import { z } from "zod";

import { prisma } from "../../shared/prisma";
import { autenticarDiretorio } from "./autenticarDiretorio";
import { ResolverTenantService } from "./ResolverTenantService";
import { ResolverMensageriaService } from "./ResolverMensageriaService";
import { SincronizarMensageriaService } from "./SincronizarMensageriaService";

export const diretorioRoutes = Router();
const slugSchema = z.string().regex(/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/);
const tipoMensageriaSchema = z.enum(["WHATSAPP", "INSTAGRAM"]);
const identificadorSchema = z.string().trim().min(1).max(200);
const sincronizarMensageriaSchema = z.object({
  tenantKey: z.string().uuid(), tipo: tipoMensageriaSchema, identificadorExterno: identificadorSchema,
  appSecretRef: z.string().trim().min(1).max(500), ativo: z.boolean(),
}).strict();

diretorioRoutes.put("/mensageria", autenticarDiretorio, async (request, response) => {
  const dados = sincronizarMensageriaSchema.safeParse(request.body);
  if (!dados.success) return response.status(400).json({ mensagem: "Dados de mensageria inválidos." });
  try {
    return response.json(await new SincronizarMensageriaService(prisma).execute(dados.data));
  } catch (erro) {
    if (erro instanceof Error && erro.message === "TENANT_NAO_ENCONTRADO") return response.status(404).json({ mensagem: "Tenant não encontrado." });
    if (erro instanceof Error && erro.message === "CONTA_MENSAGERIA_EM_USO") return response.status(409).json({ mensagem: "Conta de mensageria já vinculada." });
    throw erro;
  }
});

diretorioRoutes.get("/mensageria/:tipo/:identificador", autenticarDiretorio, async (request, response) => {
  const tipo = tipoMensageriaSchema.safeParse(String(request.params.tipo).toUpperCase());
  const identificador = identificadorSchema.safeParse(request.params.identificador);
  if (!tipo.success || !identificador.success) {
    return response.status(404).json({ mensagem: "Conta de mensageria não encontrada." });
  }
  try {
    return response.json(await new ResolverMensageriaService(prisma).execute(tipo.data, identificador.data));
  } catch (erro) {
    if (erro instanceof Error && erro.message === "CONTA_MENSAGERIA_NAO_ENCONTRADA") {
      return response.status(404).json({ mensagem: "Conta de mensageria não encontrada." });
    }
    throw erro;
  }
});

diretorioRoutes.get("/:slug", autenticarDiretorio, async (request, response) => {
  const slug = slugSchema.safeParse(request.params.slug);
  if (!slug.success) return response.status(404).json({ mensagem: "Tenant não encontrado." });
  try {
    return response.json(await new ResolverTenantService(prisma).execute(slug.data));
  } catch (erro) {
    if (erro instanceof Error && erro.message === "TENANT_NAO_ENCONTRADO") {
      return response.status(404).json({ mensagem: "Tenant não encontrado." });
    }
    throw erro;
  }
});
