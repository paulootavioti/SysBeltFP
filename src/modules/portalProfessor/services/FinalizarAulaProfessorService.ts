import { prismaDaRequisicao } from "../../../shared/database/prismaDaRequisicao";
import { FinalizarAulaService } from "../../aulas/services/FinalizarAulaService";

interface Solicitante {
  id: number;
  perfil: string;
  unidadeId: number | null;
}

export class FinalizarAulaProfessorService {
  async execute(aulaId: number, solicitante: Solicitante, observacoes?: string) {
    const prisma = prismaDaRequisicao();
    // reaproveita a checagem de turma própria/unidade e a transição de
    // status ABERTA -> FINALIZADA já usada pelo sgcl-web.
    await new FinalizarAulaService().execute(aulaId, solicitante, observacoes);

    const aula = await prisma.aula.findUniqueOrThrow({
      where: { id: aulaId },
      include: {
        turma: true,
        aulaCurriculo: { include: { tecnicas: true } },
        tecnicasRealizadas: true,
        alunos: true,
        notas: true,
        fotos: true,
      },
    });

    const totalAlunos = aula.alunos.length;
    const presentes = aula.alunos.filter((registro) => registro.presente).length;
    const percentualPresenca = totalAlunos === 0 ? 0 : Math.round((presentes / totalAlunos) * 100);

    const totalTecnicasPlanejadas = aula.aulaCurriculo?.tecnicas.length ?? 0;
    const tecnicasExecutadas = aula.tecnicasRealizadas.length;

    const alunosComNota = new Set(aula.notas.map((nota) => nota.alunoId)).size;

    const duracaoMinutos = Math.max(0, Math.round((aula.updatedAt.getTime() - aula.createdAt.getTime()) / 60000));

    return {
      aulaId: aula.id,
      turmaNome: aula.turma?.nome ?? null,
      duracaoMinutos,
      presenca: { presentes, total: totalAlunos, percentual: percentualPresenca },
      tecnicas: { executadas: tecnicasExecutadas, planejadas: totalTecnicasPlanejadas },
      observacaoRegistrada: !!aula.observacoes,
      alunosComNota,
      fotos: aula.fotos.map((foto) => ({ id: foto.id, visivelNaLanding: foto.visivelNaLanding })),
    };
  }
}
