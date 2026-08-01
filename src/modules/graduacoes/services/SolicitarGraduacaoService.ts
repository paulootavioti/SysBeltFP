import { prisma } from "../../../shared/database/prisma";
import { AppError } from "../../../shared/errors/AppError";
import { validarProgressaoFaixa } from "../utils/validarProgressaoFaixa";

interface SolicitarGraduacaoDTO {
  alunoId: number;
  faixa: string;
  comentario?: string;
  solicitanteId: number;
  unidadeIdSolicitante: number | null;
}

// Usado pelo PROFESSOR na Área do Professor: registra o pedido como
// "pendente" e não altera Aluno.faixa nem gera cobrança — isso só
// acontece quando o ADMIN aprova (ver AprovarGraduacaoService).
export class SolicitarGraduacaoService {
  async execute({ alunoId, faixa, comentario, solicitanteId, unidadeIdSolicitante }: SolicitarGraduacaoDTO) {
    const aluno = await prisma.aluno.findUnique({
      where: { id: alunoId },
    });

    if (!aluno) {
      throw new AppError("Aluno não encontrado.");
    }

    if (unidadeIdSolicitante !== null && aluno.unidadeId !== unidadeIdSolicitante) {
      throw new AppError("Aluno não encontrado.");
    }

    await validarProgressaoFaixa(aluno, faixa);

    return prisma.graduacao.create({
      data: {
        unidadeId: aluno.unidadeId,
        faixa,
        data: new Date(),
        alunoId,
        status: "pendente",
        comentario,
        solicitadoPorId: solicitanteId,
      },
    });
  }
}
