import { prisma } from "../../../shared/database/prisma";
import { AppError } from "../../../shared/errors/AppError";
import { validarProgressaoFaixa } from "../utils/validarProgressaoFaixa";

interface CobrancaDTO {
  valor: number;
  vencimento: string;
}

interface CreateGraduacaoDTO {
  faixa: string;
  data: string;
  alunoId: number;
  cobranca?: CobrancaDTO;
}

export class CreateGraduacaoService {
  async execute({ faixa, data, alunoId, cobranca }: CreateGraduacaoDTO) {
    const aluno = await prisma.aluno.findUnique({
      where: { id: alunoId },
    });

    if (!aluno) {
      throw new AppError("Aluno não encontrado.");
    }

    await validarProgressaoFaixa(aluno, faixa);

    const [graduacao] = await prisma.$transaction([
      prisma.graduacao.create({
        data: {
          unidadeId: aluno.unidadeId,
          faixa,
          data: new Date(data),
          alunoId,
          status: "aprovada",
        },
      }),
      prisma.aluno.update({
        where: { id: alunoId },
        data: { faixa },
      }),
      ...(cobranca
        ? [
            prisma.mensalidade.create({
              data: {
                unidadeId: aluno.unidadeId,
                valor: cobranca.valor,
                vencimento: new Date(cobranca.vencimento),
                alunoId,
                descricao: `Troca de faixa - ${faixa}`,
              },
            }),
          ]
        : []),
    ]);

    return graduacao;
  }
}