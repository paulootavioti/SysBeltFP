import { prismaDaRequisicao } from "../../../shared/database/prismaDaRequisicao";
import { obterUnidadePublicaId } from "../../../shared/utils/unidadePublica";

interface CriarLeadPublicoDTO {
  nome: string;
  contato: string;
  interesse: string;
}

export class CriarLeadPublicoService {
  async execute(dados: CriarLeadPublicoDTO) {
    const prisma = prismaDaRequisicao();
    const unidadeId = obterUnidadePublicaId();

    return prisma.lead.create({
      data: { ...dados, unidadeId },
    });
  }
}
