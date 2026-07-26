import { prisma } from "../../../shared/database/prisma";
import { AppError } from "../../../shared/errors/AppError";
import { garantirAcessoUnidade } from "../../../shared/utils/escopoUnidade";

interface CreateAulaCurriculoDTO {
  titulo: string;
  objetivo?: string;
  descricao?: string;
  duracaoMinutos?: number;
  jogosSugeridos?: string;
  ordem?: number;
  moduloId: number;
}

export class CreateAulaCurriculoService {
  async execute(data: CreateAulaCurriculoDTO, unidadeId: number | null) {
    const modulo = await prisma.moduloCurriculo.findUnique({
      where: { id: data.moduloId },
      include: { curriculo: true },
    });

    if (!modulo) {
      throw new AppError("Módulo não encontrado.");
    }

    garantirAcessoUnidade(unidadeId, modulo.curriculo.unidadeId, "Módulo não encontrado.");

    return prisma.aulaCurriculo.create({
      data: {
        titulo: data.titulo,
        objetivo: data.objetivo,
        descricao: data.descricao,
        duracaoMinutos: data.duracaoMinutos,
        jogosSugeridos: data.jogosSugeridos,
        ordem: data.ordem ?? 0,
        moduloId: data.moduloId,
      },
    });
  }
}