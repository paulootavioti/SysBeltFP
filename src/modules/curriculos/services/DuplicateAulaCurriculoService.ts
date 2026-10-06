import { prismaDaRequisicao } from "../../../shared/database/prismaDaRequisicao";
import { AppError } from "../../../shared/errors/AppError";
import { garantirAcessoUnidade } from "../../../shared/utils/escopoUnidade";

export class DuplicateAulaCurriculoService {
  async execute(id: number, unidadeId: number | null) {
    const prisma = prismaDaRequisicao();
    const origem = await prisma.aulaCurriculo.findUnique({ where: { id }, include: { blocos: { orderBy: { ordem: "asc" } }, tecnicas: { orderBy: { ordem: "asc" } }, modulo: { include: { curriculo: true } } } });
    if (!origem) throw new AppError("Aula do currículo não encontrada.");
    garantirAcessoUnidade(unidadeId, origem.modulo.curriculo.unidadeId, "Aula do currículo não encontrada.");
    return prisma.aulaCurriculo.create({
      data: {
        titulo: `Cópia de ${origem.titulo}`,
        objetivo: origem.objetivo,
        descricao: origem.descricao,
        duracaoMinutos: origem.duracaoMinutos,
        jogosSugeridos: origem.jogosSugeridos,
        ordem: origem.ordem + 1,
        moduloId: origem.moduloId,
        blocos: { create: origem.blocos.map(({ id: _id, aulaCurriculoId: _aulaId, createdAt: _createdAt, updatedAt: _updatedAt, ...bloco }) => bloco) },
        tecnicas: { create: origem.tecnicas.map(({ id: _id, aulaCurriculoId: _aulaId, createdAt: _createdAt, updatedAt: _updatedAt, ...tecnica }) => tecnica) },
      },
      include: { blocos: { orderBy: { ordem: "asc" } }, tecnicas: { orderBy: { ordem: "asc" } } },
    });
  }
}
