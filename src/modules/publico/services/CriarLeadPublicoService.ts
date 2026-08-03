import { prisma } from "../../../shared/database/prisma";
import { obterUnidadePublicaId } from "../../../shared/utils/unidadePublica";

interface CriarLeadPublicoDTO {
  nome: string;
  contato: string;
  interesse: string;
}

export class CriarLeadPublicoService {
  async execute(dados: CriarLeadPublicoDTO) {
    const unidadeId = obterUnidadePublicaId();

    return prisma.lead.create({
      data: { ...dados, unidadeId },
    });
  }
}
