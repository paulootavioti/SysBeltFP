import { prismaDaRequisicao } from "../../../shared/database/prismaDaRequisicao";
import { AppError } from "../../../shared/errors/AppError";
import { garantirAcessoUnidade } from "../../../shared/utils/escopoUnidade";

export class UpdatePerfilUsuarioService {

  async execute(
    id: number,
    perfil: string,
    unidadeId: number | null
  ) {
    const prisma = prismaDaRequisicao();

    const usuario =
      await prisma.usuario.findUnique({
        where: {
          id
        }
      });

    if (!usuario) {
      throw new AppError(
        "Usuário não encontrado."
      );
    }

    garantirAcessoUnidade(unidadeId, usuario.unidadeId, "Usuário não encontrado.");

    return prisma.usuario.update({
      where: {
        id
      },
      data: {
        perfil
      }
    });

  }

}
