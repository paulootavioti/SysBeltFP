import { prismaDaRequisicao } from "../../../shared/database/prismaDaRequisicao";
import { AppError } from "../../../shared/errors/AppError";

const AULAS_POR_GRAU = 8;

export class GetResumoFamiliaService {
  async execute(alunoId: number) {
    const prisma = prismaDaRequisicao();
    const aluno = await prisma.aluno.findUnique({
      where: { id: alunoId },
      include: {
        turma: true,
      },
    });

    if (!aluno) {
      throw new AppError("Aluno não encontrado.", 404);
    }

    const totalPresencas = await prisma.aulaAluno.count({
      where: { alunoId, presente: true },
    });

    // mesma regra de sempre (8 presenças por grau) — ver
    // ListProximasGraduacoesService/GetEvolucaoAlunoService.
    const restoNoGrau = totalPresencas % AULAS_POR_GRAU;
    const aulasNoCicloAtual = restoNoGrau === 0 && totalPresencas > 0 ? AULAS_POR_GRAU : restoNoGrau;

    const proximaMensalidade = await prisma.mensalidade.findFirst({
      where: {
        alunoId,
        status: { in: ["ABERTA", "VENCIDA"] },
      },
      orderBy: { vencimento: "asc" },
    });

    const proximaAula = aluno.turmaId
      ? await prisma.aulaProgramada.findFirst({
          where: {
            turmaId: aluno.turmaId,
            data: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
            status: "PENDENTE",
          },
          orderBy: { data: "asc" },
          include: { turma: true },
        })
      : null;

    return {
      aluno: {
        id: aluno.id,
        nome: aluno.nome,
        apelido: aluno.apelido,
        faixa: aluno.faixa,
        grau: aluno.grau,
        fotoUrl: aluno.fotoUrl,
      },
      progresso: {
        aulasNoCicloAtual,
        aulasPorGrau: AULAS_POR_GRAU,
        totalPresencas,
      },
      mensalidade: proximaMensalidade
        ? {
            id: proximaMensalidade.id,
            valor: proximaMensalidade.valorFinal || proximaMensalidade.valor,
            vencimento: proximaMensalidade.vencimento,
            status: proximaMensalidade.status,
          }
        : null,
      proximaAula: proximaAula
        ? {
            data: proximaAula.data,
            turmaNome: proximaAula.turma.nome,
            horarioInicio: proximaAula.turma.horarioInicio,
            horarioFim: proximaAula.turma.horarioFim,
          }
        : null,
    };
  }
}
