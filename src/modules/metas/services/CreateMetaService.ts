import { prisma } from "../../../shared/database/prisma";
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
