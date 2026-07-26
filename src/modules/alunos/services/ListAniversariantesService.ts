import { prisma } from "../../../shared/database/prisma";
import { escopoUnidade } from "../../../shared/utils/escopoUnidade";

export class ListAniversariantesService {

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

    return aniversariantes.map(aluno => ({
      id: aluno.id,
      nome: aluno.nome,
      dataNascimento: aluno.dataNascimento,
      faixa: aluno.faixa
    }));

  }

}