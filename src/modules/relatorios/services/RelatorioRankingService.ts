import { prisma } from "../../../shared/database/prisma";
import { escopoUnidade } from "../../../shared/utils/escopoUnidade";

export class RelatorioRankingService {
  async execute(unidadeId: number | null) {
    const ranking = await prisma.aulaAluno.groupBy({
      by: ["alunoId"],
      where: {
        presente: true,
        aluno: escopoUnidade(unidadeId),
      },
      _count: {
        alunoId: true,
      },
      orderBy: {
        _count: {
          alunoId: "desc",
        },
      },
    });

    const resultado = await Promise.all(
      ranking.map(async (item, index) => {
        const aluno = await prisma.aluno.findUnique({
          where: {
            id: item.alunoId
          }
        });

        return {
          posicao: index + 1,
          nome: aluno?.nome,
          faixa: aluno?.faixa,
          presencas: item._count.alunoId
        };
      })
    );

    const linhas = resultado.map(item =>
      `${item.posicao}º - ${item.nome} | ${item.faixa} | ${item.presencas} presenças`
    );

    return {
      ranking: resultado,
      mensagem: `
🏆 RANKING DE FREQUÊNCIA

${linhas.join("\n")}

Parabéns aos alunos pela dedicação!

Equipe Cia de Lutas Weberty Viana
      `.trim()
    };
  }
}