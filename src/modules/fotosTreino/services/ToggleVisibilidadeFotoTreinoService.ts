import { prisma } from "../../../shared/database/prisma";
import { AppError } from "../../../shared/errors/AppError";
import { garantirAcessoUnidade } from "../../../shared/utils/escopoUnidade";

interface Solicitante {
  id: number;
  perfil: string;
  unidadeId: number | null;
}

export class ToggleVisibilidadeFotoTreinoService {
  async execute(id: number, solicitante: Solicitante) {
    const foto = await prisma.fotoTreino.findUnique({
      where: { id },
      include: {
        aula: {
          include: {
            alunos: {
              where: { presente: true },
              include: { aluno: { select: { nome: true, autorizaUsoImagem: true } } },
            },
          },
        },
      },
    });

    if (!foto) {
      throw new AppError("Foto não encontrada.");
    }

    garantirAcessoUnidade(solicitante.unidadeId, foto.aula.unidadeId, "Foto não encontrada.");

    if (solicitante.perfil !== "ADMIN" && foto.publicadaPorId !== solicitante.id) {
      throw new AppError("Só quem publicou a foto (ou um ADMIN) pode alterar a visibilidade dela.", 403);
    }

    const novaVisibilidade = !foto.visivelNaLanding;

    if (novaVisibilidade) {
      const semAutorizacao = foto.aula.alunos.filter((registro) => !registro.aluno.autorizaUsoImagem);

      if (semAutorizacao.length > 0) {
        const nomes = semAutorizacao.map((registro) => registro.aluno.nome).join(", ");
        throw new AppError(
          `Não é possível tornar pública: ${nomes} não ${semAutorizacao.length > 1 ? "autorizam" : "autoriza"} uso de imagem.`
        );
      }
    }

    return prisma.fotoTreino.update({
      where: { id },
      data: { visivelNaLanding: novaVisibilidade },
    });
  }
}
