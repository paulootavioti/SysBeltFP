import { prisma } from "../../../shared/database/prisma";

interface CreateTecnicaDTO {
  unidadeId: number;
  nome: string;
  categoria?: string;
  descricao?: string;
  faixaMinima?: string;
  idadeMinima?: number;
}

export class CreateTecnicaService {
  async execute(data: CreateTecnicaDTO) {
    const tecnica = await prisma.tecnica.create({
      data: {
        unidadeId: data.unidadeId,
        nome: data.nome,
        categoria: data.categoria ?? "Geral",
        descricao: data.descricao,
        faixaMinima: data.faixaMinima,
        idadeMinima: data.idadeMinima,
      },
    });

    return tecnica;
  }
}