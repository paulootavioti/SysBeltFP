import { prismaDaRequisicao } from "../../../shared/database/prismaDaRequisicao";
import { LIMITE_PADRAO_LISTAGEM } from "../../../shared/constants/pagination";
import { escopoUnidade } from "../../../shared/utils/escopoUnidade";

export class ListUsuariosService {

  async execute(unidadeId: number | null) {
    const prisma = prismaDaRequisicao();

    return prisma.usuario.findMany({
      where: escopoUnidade(unidadeId),
      take: LIMITE_PADRAO_LISTAGEM,
      select: {
        id: true,
        nome: true,
        apelido: true,
        email: true,
        perfil: true,
        nivelGraduacao: true,
        outrasGraduacoes: true,
        fotoUrl: true,
        ativo: true,
        createdAt: true,
        unidadesVinculadas: {
          select: { unidade: { select: { id: true, nome: true } } },
        },
      },
      orderBy: {
        nome: "asc"
      }
    });

  }

}
