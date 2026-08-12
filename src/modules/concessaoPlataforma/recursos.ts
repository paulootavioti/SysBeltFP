import { prisma } from "../../shared/database/prisma";
import type { RecursoPlataforma } from "../plataforma/utils/recursosDoPlano";

export async function tenantTemRecurso(recurso: RecursoPlataforma, agora = new Date()): Promise<boolean> {
  const concessao = await prisma.concessaoPlataforma.findUnique({ where: { id: 1 } });
  if (!concessao || concessao.statusAcesso !== "ATIVO" || concessao.expiraEm <= agora) return false;
  return concessao.recursos.includes(recurso);
}
