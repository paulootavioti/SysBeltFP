import { prisma } from "../../../shared/database/prisma";

interface CreateTecnicaCurriculoDTO {
  nome: string;
  categoria?: string;
  descricao?: string;
  obrigatoria?: boolean;
  ordem?: number;
  aulaCurriculoId: number;
}

export class CreateTecnicaCurriculoService {
  async execute(data: CreateTecnicaCurriculoDTO) {
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