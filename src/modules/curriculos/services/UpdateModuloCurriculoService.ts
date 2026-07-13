import { prisma } from "../../../shared/database/prisma";

interface UpdateModuloCurriculoDTO {
  nome: string;
  descricao?: string;
  faixa?: string;
  idadeMinima?: number;
  idadeMaxima?: number;
  ordem?: number;
}

export class UpdateModuloCurriculoService {
  async execute(id: number, data: UpdateModuloCurriculoDTO) {
    return prisma.moduloCurriculo.update({
      where: { id },
      data: {
        nome: data.nome,
        descricao: data.descricao,
        faixa: data.faixa,
        idadeMinima: data.idadeMinima,
        idadeMaxima: data.idadeMaxima,
        ordem: data.ordem,
      },
    });
  }
}
