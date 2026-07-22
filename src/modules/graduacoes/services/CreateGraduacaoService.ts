import { prisma } from "../../../shared/database/prisma";
import { AppError } from "../../../shared/errors/AppError";
import {
  calcularIdade,
  getTrilhaFaixa,
  getFaixasDaTrilha,
  REGRAS_FAIXA_JUVENIL_ADULTO,
} from "../../../shared/constants/faixas";

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

    const idade = calcularIdade(aluno.dataNascimento);
    const trilha = getTrilhaFaixa(idade);
    const faixasValidas = getFaixasDaTrilha(trilha);

    if (!faixasValidas.includes(faixa)) {
      throw new AppError(
        `Faixa inválida para a trilha ${
          trilha === "INFANTIL" ? "Infantil" : "Juvenil/Adulta"
        } (aluno com ${idade} anos).`
      );
    }

    const regra = REGRAS_FAIXA_JUVENIL_ADULTO[faixa];

    if (regra) {
      if (idade < regra.idadeMinima) {
        throw new AppError(
          `A faixa ${faixa} exige idade mínima de ${regra.idadeMinima} anos. O aluno tem ${idade} anos.`
        );
      }

      if (regra.tempoMinimoAnos) {
        const graduacaoAtual = await prisma.graduacao.findFirst({
          where: {
            alunoId,
            faixa: aluno.faixa,
          },
          orderBy: {
            data: "desc",
          },
        });

        const dataInicioFaixaAtual = graduacaoAtual?.data ?? aluno.createdAt;

        const anosNaFaixaAtual =
          (Date.now() - dataInicioFaixaAtual.getTime()) / (1000 * 60 * 60 * 24 * 365.25);

        if (anosNaFaixaAtual < regra.tempoMinimoAnos) {
          throw new AppError(
            `A faixa ${faixa} exige pelo menos ${regra.tempoMinimoAnos} ano(s) na faixa ${
              aluno.faixa
            }. Tempo atual: ${anosNaFaixaAtual.toFixed(1)} ano(s).`
          );
        }
      }
    }

    const [graduacao] = await prisma.$transaction([
      prisma.graduacao.create({
        data: {
          faixa,
          data: new Date(data),
          alunoId,
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