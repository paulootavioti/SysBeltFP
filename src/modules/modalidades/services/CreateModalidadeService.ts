import { Prisma } from "@prisma/client";

import { prisma } from "../../../shared/database/prisma";
import { AppError } from "../../../shared/errors/AppError";

interface CreateModalidadeDTO {
  unidadeId: number;
  nome: string;
  descricao?: string | null;
  publicoAlvo?: string | null;
  coordenadorId?: number | null;
  visivelNaLanding?: boolean;
  ordem?: number;
}

export class CreateModalidadeService {
  async execute(data: CreateModalidadeDTO) {
    await garantirCoordenadorDaUnidade(data.coordenadorId, data.unidadeId);

    try {
      return await prisma.modalidade.create({
        data: {
          unidadeId: data.unidadeId,
          nome: data.nome.trim(),
          descricao: data.descricao ?? null,
          publicoAlvo: data.publicoAlvo ?? null,
          coordenadorId: data.coordenadorId ?? null,
          visivelNaLanding: data.visivelNaLanding ?? false,
          ordem: data.ordem ?? 0,
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

// O índice único (unidadeId, nome) existe pra não haver duas "Jiu-Jitsu"
// na mesma unidade — o erro cru do Prisma não diz isso pra quem usa.
export function traduzirNomeDuplicado(erro: unknown): unknown {
  if (erro instanceof Prisma.PrismaClientKnownRequestError && erro.code === "P2002") {
    return new AppError("Já existe uma modalidade com esse nome nesta unidade.");
  }

  return erro;
}

// Coordenador de uma modalidade precisa ser alguém da própria unidade —
// senão dá pra apontar um professor de outra academia como responsável.
export async function garantirCoordenadorDaUnidade(
  coordenadorId: number | null | undefined,
  unidadeId: number
) {
  if (!coordenadorId) return;

  const coordenador = await prisma.usuario.findUnique({
    where: { id: coordenadorId },
    include: { unidadesVinculadas: { select: { unidadeId: true } } },
  });

  if (!coordenador) {
    throw new AppError("Coordenador não encontrado.", 404);
  }

  const atendeUnidade =
    coordenador.unidadeId === unidadeId ||
    coordenador.unidadesVinculadas.some((vinculo) => vinculo.unidadeId === unidadeId);

  if (!atendeUnidade) {
    throw new AppError("O coordenador precisa estar vinculado a esta unidade.");
  }
}
