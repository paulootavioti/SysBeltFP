import { prismaDaRequisicao } from "../../../shared/database/prismaDaRequisicao";
import type { FormatoValorMeta, TipoMeta } from "../constants";

interface CreateMetaDTO {
  unidadeId: number;
  nome: string;
  tipo: TipoMeta;
  valorMeta: number;
  formatoValor: FormatoValorMeta;
  dataLimite: string;
}

export class CreateMetaService {
  async execute({ unidadeId, nome, tipo, valorMeta, formatoValor, dataLimite }: CreateMetaDTO) {
    const prisma = prismaDaRequisicao();
    return prisma.meta.create({
      data: {
        unidadeId,
        nome,
        tipo,
        valorMeta,
        formatoValor,
        dataLimite: new Date(dataLimite),
      },
    });
  }
}
