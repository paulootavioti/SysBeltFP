import { prisma } from "../../../shared/database/prisma";
import { AppError } from "../../../shared/errors/AppError";
import { garantirAcessoUnidade } from "../../../shared/utils/escopoUnidade";

export class GetResumoComportamentalService {

  async execute(alunoId: number, unidadeId: number | null) {

    const aluno =
      await prisma.aluno.findUnique({
        where: {
          id: alunoId
        }
      });

    if (!aluno) {
      throw new AppError(
        "Aluno não encontrado."
      );
    }

    garantirAcessoUnidade(unidadeId, aluno.unidadeId, "Aluno não encontrado.");

    const registros =
      await prisma.comportamento.findMany({
        where: {
          alunoId
        }
      });

    const resumo = registros.reduce(
      (acc, item) => {

        acc.respeito += item.respeito;
        acc.valentia += item.valentia;
        acc.esforco += item.esforco;
        acc.atencao += item.atencao;
        acc.disciplina += item.disciplina;

        return acc;

      },
      {
        respeito: 0,
        valentia: 0,
        esforco: 0,
        atencao: 0,
        disciplina: 0
      }
    );

    return {
      aluno: aluno.nome,
      faixa: aluno.faixa,
      ...resumo
    };
  }
}