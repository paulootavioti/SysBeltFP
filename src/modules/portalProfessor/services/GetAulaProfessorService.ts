import { prisma } from "../../../shared/database/prisma";
import { GetAulaService } from "../../aulas/services/GetAulaService";
import { calcularFrequenciaPorPeriodo } from "../../../shared/utils/calcularFrequencia";

interface Solicitante {
  id: number;
  perfil: string;
  unidadeId: number | null;
}

export class GetAulaProfessorService {
  async execute(id: number, solicitante: Solicitante) {
    // reaproveita a checagem "só a própria turma" já feita pra chamada no
    // sgcl-web — lança AppError antes de chegarmos a buscar as notas.
    const aula = await new GetAulaService().execute(id, solicitante);

    const notas = await prisma.notaAula.findMany({
      where: { aulaId: id },
      orderBy: { createdAt: "desc" },
    });

    // frequência do mês por aluno — mesmo cálculo do prontuário (histórico
    // completo de presenças, não só desta aula), pra exibir "Faixa ·
    // frequência N%" na etapa de Presença/Notas do app.
    const alunoIds = aula.alunos.map((registro) => registro.alunoId);
    const historico = await prisma.aulaAluno.findMany({
      where: { alunoId: { in: alunoIds } },
      select: { alunoId: true, presente: true, aula: { select: { data: true } } },
    });

    const frequenciaPorAluno = new Map<number, number>();
    for (const alunoId of alunoIds) {
      const registrosDoAluno = historico
        .filter((registro) => registro.alunoId === alunoId)
        .map((registro) => ({ presente: registro.presente, data: registro.aula.data }));
      frequenciaPorAluno.set(alunoId, calcularFrequenciaPorPeriodo(registrosDoAluno).frequenciaMes);
    }

    const alunos = aula.alunos.map((registro) => ({
      ...registro,
      frequenciaMes: frequenciaPorAluno.get(registro.alunoId) ?? 0,
    }));

    return { ...aula, alunos, notas };
  }
}
