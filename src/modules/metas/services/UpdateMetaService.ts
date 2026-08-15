import { prismaDaRequisicao } from "../../../shared/database/prismaDaRequisicao";
import { AppError } from "../../../shared/errors/AppError";
import { garantirAcessoUnidade } from "../../../shared/utils/escopoUnidade";
import type { FormatoValorMeta, TipoMeta } from "../constants";

interface UpdateMetaDTO {
  id: number;
  unidadeIdUsuario: number | null;
  nome: string;
  tipo: TipoMeta;
  valorMeta: number;
  formatoValor: FormatoValorMeta;
  dataLimite: string;
}

export class UpdateMetaService {
  async execute({ id, unidadeIdUsuario, nome, tipo, valorMeta, formatoValor, dataLimite }: UpdateMetaDTO) {
    const prisma = prismaDaRequisicao();
    const meta = await prisma.meta.findUnique({ where: { id } });

    if (!meta) {
      throw new AppError("Meta não encontrada.");
    }

    garantirAcessoUnidade(unidadeIdUsuario, meta.unidadeId, "Meta não encontrada.");

    return prisma.meta.update({
      where: { id },
      data: { nome, tipo, valorMeta, formatoValor, dataLimite: new Date(dataLimite) },
    });
  }
}
