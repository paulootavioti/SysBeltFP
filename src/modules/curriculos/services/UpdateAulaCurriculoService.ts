import { prisma } from "../../../shared/database/prisma";

interface UpdateAulaCurriculoDTO {
  titulo: string;
  objetivo?: string;
  descricao?: string;
  duracaoMinutos?: number;
  jogosSugeridos?: string;
  ordem?: number;
}

export class UpdateAulaCurriculoService {
  async execute(id: number, data: UpdateAulaCurriculoDTO) {
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
