import { prisma } from "../../../shared/database/prisma";

interface CreateModuloCurriculoDTO {
  nome: string;
  descricao?: string;
  faixa?: string;
  idadeMinima?: number;
  idadeMaxima?: number;
  ordem?: number;
  curriculoId: number;
}

export class CreateModuloCurriculoService {
  async execute(data: CreateModuloCurriculoDTO) {
    return prisma.moduloCurriculo.create({
      data: {
        nome: data.nome,
        descricao: data.descricao,
        faixa: data.faixa,
        idadeMinima: data.idadeMinima,
        idadeMaxima: data.idadeMaxima,
        ordem: data.ordem ?? 0,
        curriculoId: data.curriculoId,
      },
    });
  }
}