import { prismaDaRequisicao } from "../../../shared/database/prismaDaRequisicao";
import { AppError } from "../../../shared/errors/AppError";
import { garantirAcessoUnidade } from "../../../shared/utils/escopoUnidade";
import { garantirCoordenadorDaUnidade, traduzirNomeDuplicado } from "./CreateModalidadeService";

interface UpdateModalidadeDTO {
  nome: string;
  descricao?: string | null;
  publicoAlvo?: string | null;
  coordenadorId?: number | null;
  visivelNaLanding?: boolean;
  ordem?: number;
}

export class UpdateModalidadeService {
  async execute(id: number, data: UpdateModalidadeDTO, unidadeId: number | null) {
    const prisma = prismaDaRequisicao();
    const modalidade = await prisma.modalidade.findUnique({ where: { id } });

    if (!modalidade) {
      throw new AppError("Modalidade não encontrada.", 404);
    }

    garantirAcessoUnidade(unidadeId, modalidade.unidadeId, "Modalidade não encontrada.");

    await garantirCoordenadorDaUnidade(data.coordenadorId, modalidade.unidadeId);

    try {
      return await prisma.modalidade.update({
        where: { id },
        data: {
          nome: data.nome.trim(),
          descricao: data.descricao ?? null,
          publicoAlvo: data.publicoAlvo ?? null,
          coordenadorId: data.coordenadorId ?? null,
          ...(data.visivelNaLanding === undefined ? {} : { visivelNaLanding: data.visivelNaLanding }),
          ...(data.ordem === undefined ? {} : { ordem: data.ordem }),
        },
        include: {
          unidade: { select: { id: true, nome: true } },
          coordenador: { select: { id: true, nome: true } },
        },
      });
    } catch (erro) {
      throw traduzirNomeDuplicado(erro);
    }
  }
}
