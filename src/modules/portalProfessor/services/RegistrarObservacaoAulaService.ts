import { prismaDaRequisicao } from "../../../shared/database/prismaDaRequisicao";
import { AppError } from "../../../shared/errors/AppError";
import { garantirAcessoUnidade } from "../../../shared/utils/escopoUnidade";

interface Solicitante {
  id: number;
  perfil: string;
  unidadeId: number | null;
}

export class RegistrarObservacaoAulaService {
  async execute(aulaId: number, texto: string, solicitante: Solicitante) {
    const prisma = prismaDaRequisicao();
    const aula = await prisma.aula.findUnique({ where: { id: aulaId }, include: { turma: true } });

    if (!aula) {
      throw new AppError("Aula não encontrada.");
    }

    garantirAcessoUnidade(solicitante.unidadeId, aula.unidadeId, "Aula não encontrada.");

    if (solicitante.perfil === "PROFESSOR" && aula.turma?.professorId !== solicitante.id) {
      throw new AppError("Você só pode registrar observações das suas próprias turmas.", 403);
    }

    if (aula.status === "FINALIZADA") {
      throw new AppError("Não é possível alterar uma aula finalizada.");
    }

    return prisma.aula.update({ where: { id: aulaId }, data: { observacoes: texto } });
  }
}
