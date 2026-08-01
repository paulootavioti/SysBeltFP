import { prisma } from "../../../shared/database/prisma";
import { AppError } from "../../../shared/errors/AppError";
import { garantirAcessoUnidade } from "../../../shared/utils/escopoUnidade";

interface EnviarMensagemFamiliaDTO {
  alunoId: number;
  remetenteTipo: "FAMILIA" | "ACADEMIA";
  remetenteNome: string;
  texto: string;
  unidadeIdSolicitante?: number | null;
}

export class EnviarMensagemFamiliaService {
  async execute({ alunoId, remetenteTipo, remetenteNome, texto, unidadeIdSolicitante = null }: EnviarMensagemFamiliaDTO) {
    const aluno = await prisma.aluno.findUnique({ where: { id: alunoId } });

    if (!aluno) {
      throw new AppError("Aluno não encontrado.", 404);
    }

    garantirAcessoUnidade(unidadeIdSolicitante, aluno.unidadeId, "Aluno não encontrado.");

    if (!texto.trim()) {
      throw new AppError("Escreva uma mensagem antes de enviar.");
    }

    return prisma.mensagemFamilia.create({
      data: {
        unidadeId: aluno.unidadeId,
        alunoId,
        remetenteTipo,
        remetenteNome,
        texto: texto.trim(),
      },
    });
  }
}
