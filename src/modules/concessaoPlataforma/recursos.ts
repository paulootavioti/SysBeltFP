import type { PrismaClient } from "@prisma/client";
import { prismaDaRequisicao } from "../../shared/database/prismaDaRequisicao";
import type { RecursoConcessao } from "./concessaoContrato";

type RepositorioConcessao = Pick<PrismaClient, "concessaoPlataforma">;

export async function tenantTemRecurso(
  recurso: RecursoConcessao,
  agora = new Date(),
  db?: RepositorioConcessao,
): Promise<boolean> {
  const repositorio = db ?? prismaDaRequisicao();
  const concessao = await repositorio.concessaoPlataforma.findUnique({ where: { id: 1 } });
  if (!concessao || concessao.statusAcesso !== "ATIVO" || concessao.expiraEm <= agora) return false;
  return concessao.recursos.includes(recurso);
}
