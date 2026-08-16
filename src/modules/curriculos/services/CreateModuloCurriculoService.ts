import { prismaDaRequisicao } from "../../../shared/database/prismaDaRequisicao";
import { AppError } from "../../../shared/errors/AppError";
import { garantirAcessoUnidade } from "../../../shared/utils/escopoUnidade";

interface CreateModuloCurriculoDTO {
  nome: string;
  descricao?: string;
  faixa?: string;
  idadeMinima?: number;
  idadeMaxima?: number;
  ordem?: number;
  curriculoId: number;
}

export class CreateModuloCurriculoService {
  async execute(data: CreateModuloCurriculoDTO, unidadeId: number | null) {
    const prisma = prismaDaRequisicao();
    const curriculo = await prisma.curriculo.findUnique({ where: { id: data.curriculoId } });

    if (!curriculo) {
      throw new AppError("Currículo não encontrado.");
    }

    garantirAcessoUnidade(unidadeId, curriculo.unidadeId, "Currículo não encontrado.");

    return prisma.moduloCurriculo.create({
      data: {
        nome: data.nome,
        descricao: data.descricao,
        faixa: data.faixa,
        idadeMinima: data.idadeMinima,
        idadeMaxima: data.idadeMaxima,
        ordem: data.ordem ?? 0,
        curriculoId: data.curriculoId,
      },
    });
  }
}
