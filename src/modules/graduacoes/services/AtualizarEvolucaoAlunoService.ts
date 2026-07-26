import { prisma } from "../../../shared/database/prisma";

const faixasKids = [
  "Branca",
  "Cinza e Branca",
  "Cinza",
  "Cinza e Preta",
  "Amarela e Branca",
  "Amarela",
  "Amarela e Preta",
  "Laranja e Branca",
  "Laranja",
  "Laranja e Preta",
  "Verde"
];

export class AtualizarEvolucaoAlunoService {
  async execute(alunoId: number) {
    const aluno = await prisma.aluno.findUnique({
      where: {
        id: alunoId
      }
    });

    if (!aluno) {
      return null;
    }

    const totalPresencas = await prisma.aulaAluno.count({
      where: {
        alunoId,
        presente: true,
      },
    });

    const aulasPorGrau = 8;
    const grausPorFaixa = 4;
    const aulasPorFaixa = aulasPorGrau * grausPorFaixa;

    const novoGrau =
      Math.floor(totalPresencas / aulasPorGrau) % grausPorFaixa;

    let novaFaixa = aluno.faixa || "Branca";

    const deveTrocarFaixa =
      totalPresencas > 0 &&
      totalPresencas % aulasPorFaixa === 0;

    if (deveTrocarFaixa) {
      const indiceAtual =
        faixasKids.indexOf(novaFaixa);

      if (
        indiceAtual >= 0 &&
        indiceAtual < faixasKids.length - 1
      ) {
        novaFaixa =
          faixasKids[indiceAtual + 1];

        await prisma.graduacao.create({
          data: {
            unidadeId: aluno.unidadeId,
            alunoId,
            faixa: novaFaixa,
            data: new Date()
          }
        });
      }
    }

    const alunoAtualizado =
      await prisma.aluno.update({
        where: {
          id: alunoId
        },
        data: {
          grau: novoGrau,
          faixa: novaFaixa
        }
      });

    return {
      aluno: alunoAtualizado,
      totalPresencas,
      novoGrau,
      novaFaixa
    };
  }
}