import { prisma } from "../../shared/database/prisma";
import type { RecursoConcessao } from "./concessaoContrato";

type RepositorioConcessao = Pick<typeof prisma, "concessaoPlataforma">;

export async function tenantTemRecurso(
  recurso: RecursoConcessao,
  agora = new Date(),
  db: RepositorioConcessao = prisma,
): Promise<boolean> {
  const concessao = await db.concessaoPlataforma.findUnique({ where: { id: 1 } });
  if (!concessao || concessao.statusAcesso !== "ATIVO" || concessao.expiraEm <= agora) return false;
  return concessao.recursos.includes(recurso);
}
