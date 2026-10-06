import { prismaDaRequisicao } from "../../../shared/database/prismaDaRequisicao";
import { AppError } from "../../../shared/errors/AppError";

function paraSlug(valor: string) {
  return valor
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

const aliases: Record<string, string> = {
  "jiu-jitsu": "jiu-jitsu-brasileiro",
  bjj: "jiu-jitsu-brasileiro",
};

/** Resolve explicitamente ou por nome a modalidade global correspondente. */
export async function resolverBibliotecaModalidade(
  nome: string,
  bibliotecaModalidadeId?: number | null
) {
  const prisma = prismaDaRequisicao();

  if (bibliotecaModalidadeId === null) return null;
  if (bibliotecaModalidadeId) {
    const modalidade = await prisma.bibliotecaModalidade.findFirst({
      where: { id: bibliotecaModalidadeId, ativa: true },
    });
    if (!modalidade) throw new AppError("Modalidade da biblioteca não encontrada.", 404);
    return modalidade.id;
  }

  const slug = aliases[paraSlug(nome)] ?? paraSlug(nome);
  const modalidade = await prisma.bibliotecaModalidade.findFirst({
    where: { ativa: true, OR: [{ slug }, { nome: { equals: nome.trim(), mode: "insensitive" } }] },
    select: { id: true },
  });
  return modalidade?.id ?? null;
}
