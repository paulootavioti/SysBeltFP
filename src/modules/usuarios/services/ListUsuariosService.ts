import { prisma } from "../../../shared/database/prisma";
import { LIMITE_PADRAO_LISTAGEM } from "../../../shared/constants/pagination";

export class ListUsuariosService {

  async execute() {

    return prisma.usuario.findMany({
      take: LIMITE_PADRAO_LISTAGEM,
      select: {
        id: true,
        nome: true,
        apelido: true,
        email: true,
        perfil: true,
        nivelGraduacao: true,
        outrasGraduacoes: true,
        ativo: true,
        createdAt: true
      },
      orderBy: {
        nome: "asc"
      }
    });

  }

}