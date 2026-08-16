import { prismaDaRequisicao } from "../database/prismaDaRequisicao";
import { AppError } from "../errors/AppError";

// A fronteira entre assinantes, na prática, é o vínculo do usuário.
//
// `ensureAuthenticated` deixa ADMIN/PROFESSOR/RECEPCAO trocar de unidade
// ativa, mas só entre as unidades a que ele tem vínculo (UsuarioUnidade).
// Ou seja: a garantia de que ninguém enxerga outro assinante depende
// inteiramente de um vínculo nunca apontar pra unidade de outra conta.
//
// Isso nunca foi verificado em lugar nenhum — funcionava porque só existia
// uma academia. Com vários assinantes, um vínculo criado errado (dedo
// escorregando num id, importação de planilha) vira acesso cruzado
// silencioso, e nada no sistema reclamaria.

export async function contaDaUnidade(unidadeId: number): Promise<number> {
  const prisma = prismaDaRequisicao();
  const unidade = await prisma.unidade.findUnique({
    where: { id: unidadeId },
    select: { contaId: true },
  });

  if (!unidade) {
    throw new AppError("Unidade não encontrada.", 404);
  }

  return unidade.contaId;
}

/**
 * Todas as unidades de um assinante. É o alcance de um DONO.
 */
export async function unidadesDaConta(contaId: number): Promise<number[]> {
  const prisma = prismaDaRequisicao();
  const unidades = await prisma.unidade.findMany({
    where: { contaId },
    select: { id: true },
  });

  return unidades.map((unidade) => unidade.id);
}

/**
 * Confirma que a lista de unidades pertence toda à MESMA conta e devolve
 * qual é. Recusa a lista inteira quando há mistura — não escolhe uma
 * "maioria" nem descarta as estranhas em silêncio, porque nesse caso não
 * dá pra saber qual era a intenção, e adivinhar erra pro lado perigoso.
 */
export async function garantirUnidadesDaMesmaConta(unidadeIds: number[]): Promise<number | null> {
  const ids = [...new Set(unidadeIds)];

  if (ids.length === 0) return null;
  const prisma = prismaDaRequisicao();

  const unidades = await prisma.unidade.findMany({
    where: { id: { in: ids } },
    select: { id: true, contaId: true },
  });

  if (unidades.length !== ids.length) {
    throw new AppError("Unidade não encontrada.", 404);
  }

  const contas = new Set(unidades.map((unidade) => unidade.contaId));

  if (contas.size > 1) {
    throw new AppError(
      "Um usuário não pode ser vinculado a unidades de assinantes diferentes."
    );
  }

  return unidades[0].contaId;
}
