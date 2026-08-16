import { prismaDaRequisicao } from "../../../shared/database/prismaDaRequisicao";
import { AppError } from "../../../shared/errors/AppError";
import { garantirAcessoUnidade } from "../../../shared/utils/escopoUnidade";

interface Solicitante {
  id: number;
  perfil: string;
  unidadeId: number | null;
}

interface CriarNotaAulaDTO {
  alunoId: number;
  tag?: string | null;
  texto?: string | null;
}

export class CriarNotaAulaService {
  async execute(aulaId: number, data: CriarNotaAulaDTO, solicitante: Solicitante) {
    const prisma = prismaDaRequisicao();
    const aula = await prisma.aula.findUnique({ where: { id: aulaId }, include: { turma: true } });

    if (!aula) {
      throw new AppError("Aula não encontrada.");
    }

    garantirAcessoUnidade(solicitante.unidadeId, aula.unidadeId, "Aula não encontrada.");

    if (solicitante.perfil === "PROFESSOR" && aula.turma?.professorId !== solicitante.id) {
      throw new AppError("Você só pode registrar notas das suas próprias turmas.", 403);
    }

    const registroAluno = await prisma.aulaAluno.findUnique({
      where: { aulaId_alunoId: { aulaId, alunoId: data.alunoId } },
    });

    if (!registroAluno) {
      throw new AppError("Aluno não faz parte desta aula.");
    }

    return prisma.notaAula.create({
      data: {
        aulaId,
        alunoId: data.alunoId,
        tag: data.tag ?? null,
        texto: data.texto ?? null,
        criadoPorId: solicitante.id,
      },
    });
  }
}
