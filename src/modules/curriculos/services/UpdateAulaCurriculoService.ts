import { prismaDaRequisicao } from "../../../shared/database/prismaDaRequisicao";
import { AppError } from "../../../shared/errors/AppError";
import { garantirAcessoUnidade } from "../../../shared/utils/escopoUnidade";

interface UpdateAulaCurriculoDTO {
  titulo: string;
  objetivo?: string;
  descricao?: string;
  duracaoMinutos?: number;
  jogosSugeridos?: string;
  ordem?: number;
}

export class UpdateAulaCurriculoService {
  async execute(id: number, data: UpdateAulaCurriculoDTO, unidadeId: number | null) {
    const prisma = prismaDaRequisicao();
    const aulaCurriculo = await prisma.aulaCurriculo.findUnique({
      where: { id },
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

    return prisma.aulaCurriculo.update({
      where: { id },
      data: {
        titulo: data.titulo,
        objetivo: data.objetivo,
        descricao: data.descricao,
        duracaoMinutos: data.duracaoMinutos,
        jogosSugeridos: data.jogosSugeridos,
        ordem: data.ordem,
      },
    });
  }
}
