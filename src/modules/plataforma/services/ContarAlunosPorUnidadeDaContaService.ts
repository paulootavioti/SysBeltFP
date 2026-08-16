import { prismaDaRequisicao } from "../../../shared/database/prismaDaRequisicao";
import type { ContagemDaUnidade } from "../utils/precoPlataforma";

// Base da cobrança por licença: devolve todas as unidades ATIVAS da conta,
// inclusive as que ainda não têm aluno. Uma filial ativa ocupa uma licença
// e, portanto, precisa aparecer com contagem zero para receber o piso do plano.
export class ContarAlunosPorUnidadeDaContaService {
  async execute(contaId: number): Promise<ContagemDaUnidade[]> {
    const prisma = prismaDaRequisicao();
    const [unidades, contagens] = await Promise.all([
      prisma.unidade.findMany({
        where: { contaId, ativo: true },
        select: { id: true, nome: true },
        orderBy: { id: "asc" },
      }),
      prisma.alunoUnidade.groupBy({
        by: ["unidadeId"],
        where: { aluno: { ativo: true }, unidade: { contaId, ativo: true } },
        _count: { _all: true },
      }),
    ]);

    const alunosPorUnidade = new Map(
      contagens.map((contagem) => [contagem.unidadeId, contagem._count._all])
    );

    return unidades.map((unidade) => ({
      unidadeId: unidade.id,
      nomeUnidade: unidade.nome,
      alunosContados: alunosPorUnidade.get(unidade.id) ?? 0,
    }));
  }
}
