import { prisma } from "../../../shared/database/prisma";

interface CreateCurriculoDTO {
  unidadeId: number;
  nome: string;
  descricao?: string;
  modalidade?: string;
  publico?: string;
}

export class CreateCurriculoService {
  async execute(data: CreateCurriculoDTO) {
    return prisma.curriculo.create({
      data: {
        unidadeId: data.unidadeId,
        nome: data.nome,
        descricao: data.descricao,
        modalidade: data.modalidade ?? "Jiu-Jitsu",
        publico: data.publico ?? "Kids",
      },
    });
  }
}