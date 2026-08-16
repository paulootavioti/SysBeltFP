import { prismaDaRequisicao } from "../../../shared/database/prismaDaRequisicao";

interface CreateModeloContratoDTO {
  unidadeId: number;
  nome: string;
  conteudo: string;
}

export class CreateModeloContratoService {
  async execute(data: CreateModeloContratoDTO) {
    const prisma = prismaDaRequisicao();
    return prisma.modeloContrato.create({
      data: {
        unidadeId: data.unidadeId,
        nome: data.nome,
        conteudo: data.conteudo,
      },
    });
  }
}
