import { prisma } from "../../../shared/database/prisma";
import { AppError } from "../../../shared/errors/AppError";
import {
  calcularIdade,
  getTrilhaFaixa,
  getFaixasDaTrilha,
  REGRAS_FAIXA_JUVENIL_ADULTO,
} from "../../../shared/constants/faixas";

interface AlunoParaValidacao {
  id: number;
  dataNascimento: Date;
  faixa: string;
  createdAt: Date;
}

// Mesma regra usada tanto na graduação direta do ADMIN quanto na
// solicitação do PROFESSOR: garante que a faixa pedida é válida pra
// trilha do aluno (idade) e, pra trilha adulta, respeita idade mínima e
// tempo mínimo na faixa atual.
export async function validarProgressaoFaixa(aluno: AlunoParaValidacao, faixa: string) {
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

  if (!regra) return;

  if (idade < regra.idadeMinima) {
    throw new AppError(
      `A faixa ${faixa} exige idade mínima de ${regra.idadeMinima} anos. O aluno tem ${idade} anos.`
    );
  }

  if (regra.tempoMinimoAnos) {
    const graduacaoAtual = await prisma.graduacao.findFirst({
      where: {
        alunoId: aluno.id,
        faixa: aluno.faixa,
        status: "aprovada",
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
