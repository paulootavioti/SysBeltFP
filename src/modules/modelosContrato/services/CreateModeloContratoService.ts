import { prisma } from "../../../shared/database/prisma";

interface CreateModeloContratoDTO {
  unidadeId: number;
  nome: string;
  conteudo: string;
}

export class CreateModeloContratoService {
  async execute(data: CreateModeloContratoDTO) {
    return prisma.modeloContrato.create({
      data: {
        unidadeId: data.unidadeId,
        nome: data.nome,
        conteudo: data.conteudo,
      },
    });
  }
}
