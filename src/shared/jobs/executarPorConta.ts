import type { PrismaClient } from "@prisma/client";

export interface LoteConta<T> {
  contaId: number;
  unidades: number;
  resultado?: T;
  erro?: string;
}

export async function executarPorConta<T>(
  prisma: PrismaClient,
  executarUnidade: (unidadeId: number) => Promise<T>,
): Promise<LoteConta<T>[]> {
  const contas = await prisma.conta.findMany({
    where: { ativo: true },
    orderBy: { id: "asc" },
    select: { id: true, unidades: { where: { ativo: true }, orderBy: { id: "asc" }, select: { id: true } } },
  });
  const lotes: LoteConta<T>[] = [];
  for (const conta of contas) {
    for (const unidade of conta.unidades) {
      try {
        lotes.push({ contaId: conta.id, unidades: 1, resultado: await executarUnidade(unidade.id) });
      } catch {
        lotes.push({ contaId: conta.id, unidades: 1, erro: "FALHA_NO_LOTE" });
      }
    }
  }
  return lotes;
}
