import { prisma } from "../../../shared/database/prisma";
import { AppError } from "../../../shared/errors/AppError";
import { UpdateAulaAlunoService } from "../../aulas/services/UpdateAulaAlunoService";

interface Solicitante {
  id: number;
  perfil: string;
  unidadeId: number | null;
}

interface MarcarPresencaDTO {
  alunoId: number;
  presente: boolean;
}

export class MarcarPresencaProfessorService {
  async execute(aulaId: number, data: MarcarPresencaDTO, solicitante: Solicitante) {
    const registro = await prisma.aulaAluno.findUnique({
      where: { aulaId_alunoId: { aulaId, alunoId: data.alunoId } },
    });

    if (!registro) {
      throw new AppError("Aluno não faz parte desta aula.");
    }

    // dono da checagem de unidade/turma própria/aula finalizada — reaproveitado
    // integralmente da chamada do sgcl-web, sem duplicar a regra aqui.
    return new UpdateAulaAlunoService().execute({ id: registro.id, presente: data.presente }, solicitante);
  }
}
