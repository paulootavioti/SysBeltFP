import { prisma } from "../../../shared/database/prisma";
import { escopoUnidade } from "../../../shared/utils/escopoUnidade";

export class ListMensalidadesService {

  async execute(unidadeId: number | null) {

    const mensalidades =
      await prisma.mensalidade.findMany({
        where: escopoUnidade(unidadeId),
        include: {
          aluno: true
        }
      });

    return mensalidades;
  }

}