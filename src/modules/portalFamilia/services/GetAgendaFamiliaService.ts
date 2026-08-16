import { prismaDaRequisicao } from "../../../shared/database/prismaDaRequisicao";
import { AppError } from "../../../shared/errors/AppError";

interface ItemAgenda {
  tipo: "AULA" | "EVENTO";
  data: Date;
  titulo: string;
  descricao?: string | null;
  local?: string | null;
}

export class GetAgendaFamiliaService {
  async execute(alunoId: number) {
    const prisma = prismaDaRequisicao();
    const aluno = await prisma.aluno.findUnique({ where: { id: alunoId } });

    if (!aluno) {
      throw new AppError("Aluno não encontrado.", 404);
    }

    const hoje = new Date(new Date().setHours(0, 0, 0, 0));

    const [aulasProgramadas, eventos] = await Promise.all([
      aluno.turmaId
        ? prisma.aulaProgramada.findMany({
            where: {
              turmaId: aluno.turmaId,
              data: { gte: hoje },
              status: "PENDENTE",
            },
            include: { turma: true },
            orderBy: { data: "asc" },
            take: 10,
          })
        : Promise.resolve([]),
      prisma.evento.findMany({
        where: {
          unidadeId: aluno.unidadeId,
          dataInicio: { gte: hoje },
          status: { in: ["AGENDADO", "EM_ANDAMENTO"] },
        },
        orderBy: { dataInicio: "asc" },
        take: 10,
      }),
    ]);

    const itens: ItemAgenda[] = [
      ...aulasProgramadas.map((programada): ItemAgenda => ({
        tipo: "AULA",
        data: programada.data,
        titulo: `Aula — ${programada.turma.nome}`,
        descricao: `${programada.turma.horarioInicio} – ${programada.turma.horarioFim}`,
      })),
      ...eventos.map((evento): ItemAgenda => ({
        tipo: "EVENTO",
        data: evento.dataInicio,
        titulo: evento.titulo,
        descricao: evento.descricao,
        local: evento.local,
      })),
    ];

    return itens.sort((a, b) => a.data.getTime() - b.data.getTime());
  }
}
