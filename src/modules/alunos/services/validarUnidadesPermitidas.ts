import { prismaDaRequisicao } from "../../../shared/database/prismaDaRequisicao";
import { AppError } from "../../../shared/errors/AppError";

export async function validarUnidadesPermitidas(
  unidadePrincipalId: number,
  unidadesInformadas: number[] | undefined,
): Promise<number[]> {
  const prisma = prismaDaRequisicao();
  const ids = [...new Set([unidadePrincipalId, ...(unidadesInformadas ?? [])])];
  if (ids.some((id) => !Number.isInteger(id) || id <= 0)) {
    throw new AppError("Unidades permitidas inválidas.");
  }

  const principal = await prisma.unidade.findUnique({
    where: { id: unidadePrincipalId },
    select: { contaId: true, ativo: true },
  });
  if (!principal?.ativo) throw new AppError("Unidade principal não está ativa.");

  const unidades = await prisma.unidade.findMany({
    where: { id: { in: ids }, contaId: principal.contaId, ativo: true },
    select: { id: true },
  });
  if (unidades.length !== ids.length) {
    throw new AppError("Todas as unidades permitidas devem estar ativas e pertencer à mesma academia.");
  }

  return ids;
}
