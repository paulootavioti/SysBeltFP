import { prismaDaRequisicao } from "../../../shared/database/prismaDaRequisicao";
import { AppError } from "../../../shared/errors/AppError";
import { garantirAcessoUnidade } from "../../../shared/utils/escopoUnidade";

interface CreateTecnicaCurriculoDTO {
  nome: string;
  categoria?: string;
  descricao?: string;
  obrigatoria?: boolean;
  ordem?: number;
  aulaCurriculoId: number;
}

export class CreateTecnicaCurriculoService {
  async execute(data: CreateTecnicaCurriculoDTO, unidadeId: number | null) {
    const prisma = prismaDaRequisicao();
    const aulaCurriculo = await prisma.aulaCurriculo.findUnique({
      where: { id: data.aulaCurriculoId },
      include: { modulo: { include: { curriculo: true } } },
    });

    if (!aulaCurriculo) {
      throw new AppError("Aula do currículo não encontrada.");
    }

    garantirAcessoUnidade(
      unidadeId,
      aulaCurriculo.modulo.curriculo.unidadeId,
      "Aula do currículo não encontrada."
    );

    return prisma.tecnicaCurriculo.create({
      data: {
        nome: data.nome,
        categoria: data.categoria,
        descricao: data.descricao,
        obrigatoria: data.obrigatoria ?? true,
        ordem: data.ordem ?? 0,
        aulaCurriculoId: data.aulaCurriculoId,
      },
    });
  }
}
