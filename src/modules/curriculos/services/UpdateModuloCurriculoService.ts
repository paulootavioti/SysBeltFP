import { prismaDaRequisicao } from "../../../shared/database/prismaDaRequisicao";
import { AppError } from "../../../shared/errors/AppError";
import { garantirAcessoUnidade } from "../../../shared/utils/escopoUnidade";

interface UpdateModuloCurriculoDTO {
  nome: string;
  descricao?: string;
  faixa?: string;
  idadeMinima?: number;
  idadeMaxima?: number;
  ordem?: number;
}

export class UpdateModuloCurriculoService {
  async execute(id: number, data: UpdateModuloCurriculoDTO, unidadeId: number | null) {
    const prisma = prismaDaRequisicao();
    const modulo = await prisma.moduloCurriculo.findUnique({
      where: { id },
      include: { curriculo: true },
    });

    if (!modulo) {
      throw new AppError("Módulo não encontrado.");
    }

    garantirAcessoUnidade(unidadeId, modulo.curriculo.unidadeId, "Módulo não encontrado.");

    return prisma.moduloCurriculo.update({
      where: { id },
      data: {
        nome: data.nome,
        descricao: data.descricao,
        faixa: data.faixa,
        idadeMinima: data.idadeMinima,
        idadeMaxima: data.idadeMaxima,
        ordem: data.ordem,
      },
    });
  }
}
