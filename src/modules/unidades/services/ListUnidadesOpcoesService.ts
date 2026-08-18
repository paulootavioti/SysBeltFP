import { prismaDaRequisicao } from "../../../shared/database/prismaDaRequisicao";
import { escopoDeUnidadePropria } from "../../../shared/utils/escopoUnidade";

// Versão enxuta de ListUnidadesService — só id/nome das unidades ativas,
// pra popular seletores (ex.: consulta de grade horária de outra unidade)
// sem expor os dados completos de todas as unidades.
//
// Restrito à CONTA de quem pergunta: um ADMIN escolhe entre as filiais da
// própria academia e não pode nem enxergar o nome das unidades de outro
// assinante. O DONO, que não tem unidade fixa (RN-164), precisa continuar
// vendo as filiais da conta dele — é justamente aqui que ele alterna entre
// elas (RN-165).
export class ListUnidadesOpcoesService {
  async execute(unidadeAtivaId: number | null) {
    const prisma = prismaDaRequisicao();

    const escopo =
      unidadeAtivaId === null
        ? escopoDeUnidadePropria(null)
        : { contaId: await resolverConta(unidadeAtivaId) };

    return prisma.unidade.findMany({
      where: { ativo: true, ...escopo },
      select: { id: true, nome: true },
      orderBy: { nome: "asc" },
    });
  }
}

async function resolverConta(unidadeAtivaId: number): Promise<number> {
  const prisma = prismaDaRequisicao();

  const unidade = await prisma.unidade.findUnique({
    where: { id: unidadeAtivaId },
    select: { contaId: true },
  });

  // Unidade inexistente: devolve uma conta impossível em vez de cair no
  // caso "sem filtro". Falha fechado — erro de dado não vira acesso amplo.
  return unidade?.contaId ?? -1;
}
