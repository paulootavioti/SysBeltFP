import { prisma } from "../../../shared/database/prisma";
import { AppError } from "../../../shared/errors/AppError";
import { garantirSemMensalidadeNoMes } from "../utils/garantirSemMensalidadeNoMes";

interface CreateMensalidadeDTO {
  valor: number;
  vencimento: string;
  alunoId: number;
  descricao?: string | null;
}

export class CreateMensalidadeService {

  async execute({
    valor,
    vencimento,
    alunoId,
    descricao
  }: CreateMensalidadeDTO) {

    await garantirSemMensalidadeNoMes(alunoId, vencimento);

    const aluno = await prisma.aluno.findUnique({
      where: { id: alunoId },
      select: { unidadeId: true },
    });

    if (!aluno) {
      throw new AppError("Aluno não encontrado.");
    }

    const mensalidade =
      await prisma.mensalidade.create({
        data: {
          unidadeId: aluno.unidadeId,
          valor,
          vencimento: new Date(vencimento),
          alunoId,
          descricao: descricao?.trim() || "Mensalidade"
        }
      });

    return mensalidade;
  }
}