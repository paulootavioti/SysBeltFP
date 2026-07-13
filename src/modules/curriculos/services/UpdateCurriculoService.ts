import { prisma } from "../../../shared/database/prisma";

interface UpdateCurriculoDTO {
  nome: string;
  descricao?: string;
  modalidade?: string;
  publico?: string;
}

export class UpdateCurriculoService {
  async execute(id: number, data: UpdateCurriculoDTO) {
    return prisma.curriculo.update({
      where: { id },
      data: {
        nome: data.nome,
        descricao: data.descricao,
        modalidade: data.modalidade ?? "Jiu-Jitsu",
        publico: data.publico ?? "Kids",
      },
    });
  }
}
