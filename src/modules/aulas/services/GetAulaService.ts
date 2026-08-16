import { prismaDaRequisicao } from "../../../shared/database/prismaDaRequisicao";
import { AppError } from "../../../shared/errors/AppError";
import { garantirAcessoUnidade } from "../../../shared/utils/escopoUnidade";
import { aulaIncludeCompleto } from "./aulaInclude";

interface Solicitante {
  id: number;
  perfil: string;
  unidadeId: number | null;
}

export class GetAulaService {
  async execute(id: number, solicitante: Solicitante) {
    const prisma = prismaDaRequisicao();
    const aula = await prisma.aula.findUnique({
      where: {
        id,
      },
      include: aulaIncludeCompleto,
    });

    if (!aula) {
      throw new AppError("Aula não encontrada.");
    }

    garantirAcessoUnidade(solicitante.unidadeId, aula.unidadeId, "Aula não encontrada.");

    // o professor titular só acessa a chamada das próprias turmas — ADMIN
    // e RECEPCAO enxergam qualquer aula da unidade.
    if (solicitante.perfil === "PROFESSOR" && aula.turma?.professorId !== solicitante.id) {
      throw new AppError("Você só pode acessar a chamada das suas próprias turmas.", 403);
    }

    return aula;
  }
}
