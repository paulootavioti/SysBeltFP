import { prismaDaRequisicao } from "../../../shared/database/prismaDaRequisicao";
import { escopoUnidadeFiltrada } from "../../../shared/utils/escopoUnidade";
import { montarWhereMensalidade, type FiltrosFinanceiro } from "../utils/filtros";

export interface DashboardFinanceiro {
  receitaPrevista: number;
  receitaRecebida: number;
  receitaRecorrente: number;
  receitaPorUnidade: { unidadeId: number; unidade: string; valor: number }[];
  receitaPorProfessor: { professorId: number; professor: string; valor: number }[];
  ticketMedio: number;
  taxaInadimplencia: number;
  mensalidadesVencidas: number;
  mensalidadesPagas: number;
  cobrancasRecorrentesAtivas: number;
  proximosVencimentos: {
    id: number;
    aluno: string;
    valorFinal: number;
    vencimento: Date;
  }[];
}

export class GetDashboardFinanceiroService {
  async execute(unidadeId: number | null, filtros: FiltrosFinanceiro = {}): Promise<DashboardFinanceiro> {
    const prisma = prismaDaRequisicao();
    const where = montarWhereMensalidade(unidadeId, filtros);

    const mensalidades = await prisma.mensalidade.findMany({
      where,
      select: {
        valorFinal: true,
        status: true,
        pago: true,
        alunoId: true,
        vencimento: true,
        aluno: {
          select: {
            nome: true,
            unidadeId: true,
            unidade: { select: { nome: true } },
            turma: {
              select: {
                professorId: true,
                professor: { select: { nome: true, apelido: true } },
              },
            },
          },
        },
      },
    });

    const receitaPrevista = mensalidades
      .filter((m) => m.status !== "CANCELADA" && m.status !== "ESTORNADA")
      .reduce((soma, m) => soma + m.valorFinal, 0);

    const pagas = mensalidades.filter((m) => m.status === "PAGA");
    const receitaRecebida = pagas.reduce((soma, m) => soma + m.valorFinal, 0);

    const vencidasCount = mensalidades.filter(
      (m) => !m.pago && m.status !== "CANCELADA" && m.status !== "ESTORNADA" && m.vencimento < new Date()
    ).length;

    const abertasOuVencidasCount = mensalidades.filter(
      (m) => m.status !== "CANCELADA" && m.status !== "ESTORNADA"
    ).length;

    const taxaInadimplencia = abertasOuVencidasCount > 0 ? (vencidasCount / abertasOuVencidasCount) * 100 : 0;

    const alunosPagantes = new Set(pagas.map((m) => m.alunoId)).size;
    const ticketMedio = alunosPagantes > 0 ? receitaRecebida / alunosPagantes : 0;

    const porUnidade = new Map<number, { unidade: string; valor: number }>();
    const porProfessor = new Map<number, { professor: string; valor: number }>();

    for (const m of pagas) {
      const unidadeAtual = porUnidade.get(m.aluno.unidadeId) ?? { unidade: m.aluno.unidade.nome, valor: 0 };
      unidadeAtual.valor += m.valorFinal;
      porUnidade.set(m.aluno.unidadeId, unidadeAtual);

      const professorId = m.aluno.turma?.professorId;
      if (professorId) {
        const nomeProfessor = m.aluno.turma?.professor?.apelido || m.aluno.turma?.professor?.nome || "—";
        const professorAtual = porProfessor.get(professorId) ?? { professor: nomeProfessor, valor: 0 };
        professorAtual.valor += m.valorFinal;
        porProfessor.set(professorId, professorAtual);
      }
    }

    const proximosVencimentos = await prisma.mensalidade.findMany({
      where: { ...where, pago: false, status: { notIn: ["CANCELADA", "ESTORNADA"] } },
      orderBy: { vencimento: "asc" },
      take: 10,
      select: { id: true, valorFinal: true, vencimento: true, aluno: { select: { nome: true } } },
    });

    const whereUnidadeAssinatura = escopoUnidadeFiltrada(unidadeId, filtros.unidadeId);

    const assinaturasAtivas = await prisma.assinatura.findMany({
      where: { ...whereUnidadeAssinatura, status: "ATIVA" },
      select: { valor: true },
    });

    const cobrancasRecorrentesAtivas = assinaturasAtivas.length;
    const receitaRecorrente = assinaturasAtivas.reduce((soma, a) => soma + a.valor, 0);

    return {
      receitaPrevista,
      receitaRecebida,
      receitaRecorrente,
      receitaPorUnidade: Array.from(porUnidade.entries()).map(([id, dados]) => ({
        unidadeId: id,
        unidade: dados.unidade,
        valor: dados.valor,
      })),
      receitaPorProfessor: Array.from(porProfessor.entries()).map(([id, dados]) => ({
        professorId: id,
        professor: dados.professor,
        valor: dados.valor,
      })),
      ticketMedio,
      taxaInadimplencia,
      mensalidadesVencidas: vencidasCount,
      mensalidadesPagas: pagas.length,
      cobrancasRecorrentesAtivas,
      proximosVencimentos: proximosVencimentos.map((m) => ({
        id: m.id,
        aluno: m.aluno.nome,
        valorFinal: m.valorFinal,
        vencimento: m.vencimento,
      })),
    };
  }
}
