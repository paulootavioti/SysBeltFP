import { prisma } from "../../../shared/database/prisma";
import { AppError } from "../../../shared/errors/AppError";
import { garantirAcessoUnidade } from "../../../shared/utils/escopoUnidade";

interface UpdateTecnicaCurriculoDTO {
  nome: string;
  categoria?: string;
  descricao?: string;
  obrigatoria?: boolean;
  ordem?: number;
}

export class UpdateTecnicaCurriculoService {
  async execute(id: number, data: UpdateTecnicaCurriculoDTO, unidadeId: number | null) {
    const tecnicaCurriculo = await prisma.tecnicaCurriculo.findUnique({
      where: { id },
      include: { aulaCurriculo: { include: { modulo: { include: { curriculo: true } } } } },
    });

    if (!tecnicaCurriculo) {
      throw new AppError("Técnica não encontrada.");
    }

    garantirAcessoUnidade(
      unidadeId,
      tecnicaCurriculo.aulaCurriculo.modulo.curriculo.unidadeId,
      "Técnica não encontrada."
    );

    return prisma.tecnicaCurriculo.update({
      where: { id },
      data: {
        nome: data.nome,
        categoria: data.categoria,
        descricao: data.descricao,
        obrigatoria: data.obrigatoria,
        ordem: data.ordem,
      },
    });
  }
}
