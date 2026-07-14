import { prisma } from "../../../shared/database/prisma";
import { AppError } from "../../../shared/errors/AppError";
import { garantirSemMensalidadeNoMes } from "../../mensalidades/utils/garantirSemMensalidadeNoMes";

const GRAUS_MAXIMOS_POR_FAIXA = 4;

interface CobrancaDTO {
  valor: number;
  vencimento: string;
}

interface IncrementarGrauDTO {
  alunoId: number;
  cobranca?: CobrancaDTO;
}

export class IncrementarGrauService {
  async execute({ alunoId, cobranca }: IncrementarGrauDTO) {
    const aluno = await prisma.aluno.findUnique({
      where: { id: alunoId },
    });

    if (!aluno) {
      throw new AppError("Aluno não encontrado.");
    }

    if (aluno.grau >= GRAUS_MAXIMOS_POR_FAIXA) {
      throw new AppError(
        `O aluno já está no grau máximo (${GRAUS_MAXIMOS_POR_FAIXA}) desta faixa. Registre a troca de faixa.`
      );
    }

    if (cobranca) {
      await garantirSemMensalidadeNoMes(alunoId, cobranca.vencimento);
    }

    const [alunoAtualizado] = await prisma.$transaction([
      prisma.aluno.update({
        where: { id: alunoId },
        data: { grau: { increment: 1 } },
      }),
      ...(cobranca
        ? [
            prisma.mensalidade.create({
              data: {
                valor: cobranca.valor,
                vencimento: new Date(cobranca.vencimento),
                alunoId,
              },
            }),
          ]
        : []),
    ]);

    return alunoAtualizado;
  }
}
