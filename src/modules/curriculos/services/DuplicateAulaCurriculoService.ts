import { prismaDaRequisicao } from "../../../shared/database/prismaDaRequisicao";
import { AppError } from "../../../shared/errors/AppError";
import { garantirAcessoUnidade } from "../../../shared/utils/escopoUnidade";

export class DuplicateAulaCurriculoService {
  async execute(id: number, unidadeId: number | null) {
    const prisma = prismaDaRequisicao();
    const origem = await prisma.aulaCurriculo.findUnique({ where: { id }, include: { blocos: { orderBy: { ordem: "asc" } }, tecnicas: { orderBy: { ordem: "asc" } }, modulo: { include: { curriculo: true } } } });
    if (!origem) throw new AppError("Aula do currículo não encontrada.");
    garantirAcessoUnidade(unidadeId, origem.modulo.curriculo.unidadeId, "Aula do currículo não encontrada.");
    // Abre espaço logo após a origem. A operação inteira é transacional para
    // duas duplicações simultâneas não produzirem ordens ambíguas.
    return prisma.$transaction(async (tx) => {
      const ordemDaCopia = origem.ordem + 1;
      await tx.aulaCurriculo.updateMany({
        where: { moduloId: origem.moduloId, ordem: { gte: ordemDaCopia } },
        data: { ordem: { increment: 1 } },
      });
      return tx.aulaCurriculo.create({
        data: {
          titulo: `Cópia de ${origem.titulo}`,
          objetivo: origem.objetivo,
          descricao: origem.descricao,
          duracaoMinutos: origem.duracaoMinutos,
          jogosSugeridos: origem.jogosSugeridos,
          templatePlanejamentoId: origem.templatePlanejamentoId,
          templateAplicadoEm: origem.templateAplicadoEm,
          ordem: ordemDaCopia,
          moduloId: origem.moduloId,
          blocos: { create: origem.blocos.map(({ id: _id, aulaCurriculoId: _aulaId, createdAt: _createdAt, updatedAt: _updatedAt, ...bloco }) => bloco) },
          tecnicas: { create: origem.tecnicas.map(({ id: _id, aulaCurriculoId: _aulaId, createdAt: _createdAt, updatedAt: _updatedAt, ...tecnica }) => tecnica) },
        },
        include: { blocos: { orderBy: { ordem: "asc" } }, tecnicas: { orderBy: { ordem: "asc" } } },
      });
    });
  }
}
