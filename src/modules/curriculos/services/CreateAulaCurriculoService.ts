import { prisma } from "../../../shared/database/prisma";

interface CreateAulaCurriculoDTO {
  titulo: string;
  objetivo?: string;
  descricao?: string;
  duracaoMinutos?: number;
  jogosSugeridos?: string;
  ordem?: number;
  moduloId: number;
}

export class CreateAulaCurriculoService {
  async execute(data: CreateAulaCurriculoDTO) {
    return prisma.aulaCurriculo.create({
      data: {
        titulo: data.titulo,
        objetivo: data.objetivo,
        descricao: data.descricao,
        duracaoMinutos: data.duracaoMinutos,
        jogosSugeridos: data.jogosSugeridos,
        ordem: data.ordem ?? 0,
        moduloId: data.moduloId,
      },
    });
  }
}