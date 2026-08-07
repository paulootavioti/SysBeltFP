import { prisma } from "../../../shared/database/prisma";

interface CreateCurriculoDTO {
  unidadeId: number;
  nome: string;
  descricao?: string;
  modalidadeId?: number | null;
  publico?: string;
}

export class CreateCurriculoService {
  async execute(data: CreateCurriculoDTO) {
    return prisma.curriculo.create({
      data: {
        unidadeId: data.unidadeId,
        nome: data.nome,
        descricao: data.descricao,
        modalidadeId: data.modalidadeId ?? null,
        publico: data.publico ?? "Kids",
      },
    });
  }
}