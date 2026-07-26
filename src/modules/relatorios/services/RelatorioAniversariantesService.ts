import { prisma } from "../../../shared/database/prisma";
import { escopoUnidade } from "../../../shared/utils/escopoUnidade";

export class RelatorioAniversariantesService {

  async execute(unidadeId: number | null) {

    const mesAtual =
      new Date().getMonth() + 1;

    const alunos =
      await prisma.aluno.findMany({
        where: {
          ativo: true,
          ...escopoUnidade(unidadeId)
        },
        orderBy: {
          nome: "asc"
        }
      });

    const aniversariantes =
      alunos.filter(aluno => {

        const mesNascimento =
          new Date(aluno.dataNascimento)
            .getMonth() + 1;

        return mesNascimento === mesAtual;

      });

    const linhas =
      aniversariantes.map(aluno => {

    const dataNascimento =
      new Date(aluno.dataNascimento);

    const data =
      dataNascimento.toLocaleDateString("pt-BR", {
        timeZone: "UTC"
      });
        
    return `🎂 ${aluno.nome} - ${data}`;
      });

    return {

      totalAniversariantes:
        aniversariantes.length,

      aniversariantes,

      mensagem: `
🎉 ANIVERSARIANTES DO MÊS

${linhas.length > 0
  ? linhas.join("\n")
  : "Nenhum aniversariante neste mês."}

Equipe Cia de Lutas Weberty Viana
      `.trim()

    };

  }

}