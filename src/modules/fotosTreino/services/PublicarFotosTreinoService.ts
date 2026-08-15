import { prismaDaRequisicao } from "../../../shared/database/prismaDaRequisicao";
import { AppError } from "../../../shared/errors/AppError";
import { garantirAcessoUnidade } from "../../../shared/utils/escopoUnidade";

interface Solicitante {
  id: number;
  perfil: string;
  unidadeId: number | null;
}

interface PublicarFotosTreinoDTO {
  aulaId: number;
  urls: string[];
  legenda: string;
  visivelNaLanding: boolean;
}

export class PublicarFotosTreinoService {
  async execute(data: PublicarFotosTreinoDTO, solicitante: Solicitante) {
    const prisma = prismaDaRequisicao();
    const aula = await prisma.aula.findUnique({
      where: { id: data.aulaId },
      include: {
        turma: true,
        alunos: {
          where: { presente: true },
          include: { aluno: { select: { id: true, nome: true, autorizaUsoImagem: true } } },
        },
      },
    });

    if (!aula) {
      throw new AppError("Aula não encontrada.");
    }

    garantirAcessoUnidade(solicitante.unidadeId, aula.unidadeId, "Aula não encontrada.");

    if (solicitante.perfil === "PROFESSOR" && aula.turma?.professorId !== solicitante.id) {
      throw new AppError("Você só pode publicar fotos das suas próprias turmas.", 403);
    }

    if (data.visivelNaLanding) {
      const semAutorizacao = aula.alunos.filter((registro) => !registro.aluno.autorizaUsoImagem);

      if (semAutorizacao.length > 0) {
        const nomes = semAutorizacao.map((registro) => registro.aluno.nome).join(", ");
        throw new AppError(
          `Não é possível publicar na landing pública: ${nomes} não ${semAutorizacao.length > 1 ? "autorizam" : "autoriza"} uso de imagem. A foto pode ser publicada só para o Portal da Família.`
        );
      }
    }

    const fotos = await prisma.$transaction(
      data.urls.map((url) =>
        prisma.fotoTreino.create({
          data: {
            aulaId: data.aulaId,
            url,
            legenda: data.legenda,
            publicadaPorId: solicitante.id,
            visivelNaLanding: data.visivelNaLanding,
          },
        })
      )
    );

    return { fotos, familiasPresentes: aula.alunos.length };
  }
}
