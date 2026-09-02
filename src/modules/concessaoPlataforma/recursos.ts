import type { PrismaClient } from "@prisma/client";
import { prismaDaRequisicao } from "../../shared/database/prismaDaRequisicao";
import { obterContextoRequisicao } from "../../shared/context/contextoRequisicao";
import type { RecursoConcessao } from "./concessaoContrato";

type RepositorioConcessao = Pick<PrismaClient, "concessaoPlataforma">;

export async function tenantTemRecurso(
  recurso: RecursoConcessao,
  agora = new Date(),
  db?: RepositorioConcessao & Partial<Pick<PrismaClient, "unidade">>,
  unidadeId?: number,
): Promise<boolean> {
  const repositorio = db ?? prismaDaRequisicao();
  const unidadeAlvo = unidadeId ?? obterContextoRequisicao().unidadesDoUsuario?.[0];
  if (!unidadeAlvo || !("unidade" in repositorio) || !repositorio.unidade) return false;
  const unidade = await repositorio.unidade.findUnique({ where: { id: unidadeAlvo }, select: { contaId: true } });
  if (!unidade) return false;
  const concessao = await repositorio.concessaoPlataforma.findUnique({ where: { contaId: unidade.contaId } });
  if (!concessao || concessao.statusAcesso !== "ATIVO" || concessao.expiraEm <= agora) return false;
  return concessao.recursos.includes(recurso);
}
