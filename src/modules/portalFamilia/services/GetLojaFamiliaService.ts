import { prisma } from "../../../shared/database/prisma";
import { AppError } from "../../../shared/errors/AppError";

// Vitrine consumida pela família: só produtos ativos da unidade do aluno,
// com as variantes (a família escolhe tamanho/cor a partir delas). Sem
// paginação — catálogo de loja física costuma ser pequeno o suficiente pra
// não precisar (mesmo teto informal que o resto do módulo loja).
export class GetLojaFamiliaService {
  async execute(alunoId: number) {
    const aluno = await prisma.aluno.findUnique({ where: { id: alunoId }, select: { unidadeId: true } });

    if (!aluno) {
      throw new AppError("Aluno não encontrado.", 404);
    }

    return prisma.produto.findMany({
      where: { unidadeId: aluno.unidadeId, ativo: true },
      include: { variantes: true },
      orderBy: { nome: "asc" },
    });
  }
}
