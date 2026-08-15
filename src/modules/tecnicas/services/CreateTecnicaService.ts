import { prismaDaRequisicao } from "../../../shared/database/prismaDaRequisicao";

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
    const prisma = prismaDaRequisicao();
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
