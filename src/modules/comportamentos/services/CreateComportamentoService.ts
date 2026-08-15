import { prismaDaRequisicao } from "../../../shared/database/prismaDaRequisicao";
import { AppError } from "../../../shared/errors/AppError";
import { garantirAcessoUnidade } from "../../../shared/utils/escopoUnidade";

interface CreateComportamentoDTO {
  alunoId: number;
  respeito: number;
  valentia: number;
  esforco: number;
  atencao: number;
  disciplina: number;
  observacao?: string;
}

export class CreateComportamentoService {
  async execute(data: CreateComportamentoDTO, unidadeId: number | null) {
    const prisma = prismaDaRequisicao();
    const aluno = await prisma.aluno.findUnique({ where: { id: data.alunoId } });

    if (!aluno) {
      throw new AppError("Aluno não encontrado.");
    }

    garantirAcessoUnidade(unidadeId, aluno.unidadeId, "Aluno não encontrado.");

    return prisma.comportamento.create({
      data
    });
  }
}
