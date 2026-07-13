import { prisma } from "../../../shared/database/prisma";

interface UpdateTecnicaCurriculoDTO {
  nome: string;
  categoria?: string;
  descricao?: string;
  obrigatoria?: boolean;
  ordem?: number;
}

export class UpdateTecnicaCurriculoService {
  async execute(id: number, data: UpdateTecnicaCurriculoDTO) {
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
