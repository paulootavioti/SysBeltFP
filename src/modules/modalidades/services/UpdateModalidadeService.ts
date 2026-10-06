import { prismaDaRequisicao } from "../../../shared/database/prismaDaRequisicao";
import { AppError } from "../../../shared/errors/AppError";
import { garantirAcessoUnidade } from "../../../shared/utils/escopoUnidade";
import { garantirCoordenadorDaUnidade, traduzirNomeDuplicado } from "./CreateModalidadeService";
import { resolverBibliotecaModalidade } from "./resolverBibliotecaModalidade";

interface UpdateModalidadeDTO {
  nome: string;
  descricao?: string | null;
  publicoAlvo?: string | null;
  coordenadorId?: number | null;
  visivelNaLanding?: boolean;
  ordem?: number;
  bibliotecaModalidadeId?: number | null;
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
    const bibliotecaModalidadeId = await resolverBibliotecaModalidade(data.nome, data.bibliotecaModalidadeId);

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
          bibliotecaModalidadeId,
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
