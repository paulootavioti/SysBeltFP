import { prisma } from "../../../shared/database/prisma";

export class GetFrequenciaFamiliaService {
  async execute(alunoId: number) {
    const registros = await prisma.aulaAluno.findMany({
      where: { alunoId },
      include: {
        aula: {
          include: { turma: true },
        },
      },
      orderBy: {
        aula: { data: "desc" },
      },
    });

    return registros.map((registro) => ({
      id: registro.id,
      data: registro.aula.data,
      turmaNome: registro.aula.turma?.nome ?? null,
      presente: registro.presente,
    }));
  }
}
