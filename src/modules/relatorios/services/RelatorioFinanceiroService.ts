import { prisma } from "../../../shared/database/prisma";
import { escopoUnidade } from "../../../shared/utils/escopoUnidade";

export class RelatorioFinanceiroService {
  async execute(unidadeId: number | null) {
    const mensalidadesVencidas =
      await prisma.mensalidade.findMany({
        where: {
          pago: false,
          vencimento: {
            lt: new Date()
          },
          ...escopoUnidade(unidadeId)
        },
        include: {
          aluno: true
        },
        orderBy: {
          vencimento: "asc"
        }
      });

    const totalEmAberto =
      mensalidadesVencidas.reduce(
        (total, mensalidade) =>
          total + mensalidade.valor,
        0
      );

    const linhas =
      mensalidadesVencidas.map(mensalidade => {
        const data =
          new Date(mensalidade.vencimento)
            .toLocaleDateString("pt-BR");

        return `• ${mensalidade.aluno.nome} - R$ ${mensalidade.valor.toFixed(2)} - venc. ${data}`;
      });

    return {
      totalAlunosInadimplentes:
        mensalidadesVencidas.length,

      totalEmAberto,

      mensagem: `
📋 RELATÓRIO FINANCEIRO

Mensalidades vencidas: ${mensalidadesVencidas.length}
Total em aberto: R$ ${totalEmAberto.toFixed(2)}

${linhas.length > 0 ? linhas.join("\n") : "Nenhuma mensalidade vencida encontrada."}

Equipe Cia de Lutas Weberty Viana
      `.trim()
    };
  }
}