import { prisma } from "../../../shared/database/prisma";
import { AppError } from "../../../shared/errors/AppError";
import { garantirAcessoUnidade } from "../../../shared/utils/escopoUnidade";

export class GetCurriculoService {
  async execute(id: number, unidadeId: number | null) {
    const curriculo = await prisma.curriculo.findUnique({
      where: {
        id,
      },
      include: {
        modalidade: { select: { id: true, nome: true } },
        modulos: {
          orderBy: {
            ordem: "asc",
          },
          include: {
            aulas: {
              orderBy: {
                ordem: "asc",
              },
              include: {
                tecnicas: {
                  orderBy: {
                    ordem: "asc",
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!curriculo) {
      throw new AppError("Currículo não encontrado.");
    }

    garantirAcessoUnidade(unidadeId, curriculo.unidadeId, "Currículo não encontrado.");

    return curriculo;
  }
}