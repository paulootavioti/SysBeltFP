import { prismaDaRequisicao } from "../../../shared/database/prismaDaRequisicao";

// Versão enxuta de ListUnidadesService — só id/nome das unidades ativas,
// pra popular seletores (ex.: consulta de grade horária de outra unidade)
// sem expor os dados completos de todas as unidades pra quem não é SUPERADMIN.
//
// Restrito à CONTA de quem pergunta: um ADMIN escolhe entre as filiais da
// própria academia e não pode nem enxergar o nome das unidades de outro
// assinante. Só o operador do SaaS (SUPERADMIN, sem unidade ativa) vê todas.
export class ListUnidadesOpcoesService {
  async execute(unidadeAtivaId: number | null) {
    const prisma = prismaDaRequisicao();
    const contaId = await resolverConta(unidadeAtivaId);

    return prisma.unidade.findMany({
      where: { ativo: true, ...(contaId === null ? {} : { contaId }) },
      select: { id: true, nome: true },
      orderBy: { nome: "asc" },
    });
  }
}

async function resolverConta(unidadeAtivaId: number | null): Promise<number | null> {
  if (unidadeAtivaId === null) return null;
  const prisma = prismaDaRequisicao();

  const unidade = await prisma.unidade.findUnique({
    where: { id: unidadeAtivaId },
    select: { contaId: true },
  });

  // Unidade inexistente: devolve uma conta impossível em vez de cair no
  // caso "sem filtro". Falha fechado — erro de dado não vira acesso amplo.
  return unidade?.contaId ?? -1;
}
