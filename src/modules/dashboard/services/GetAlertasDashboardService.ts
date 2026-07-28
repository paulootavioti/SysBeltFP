import { prisma } from "../../../shared/database/prisma";
import { escopoUnidade } from "../../../shared/utils/escopoUnidade";

export type PrioridadeAlerta = "BAIXA" | "MEDIA" | "ALTA" | "CRITICA";

export interface AlertaDashboard {
  id: string;
  titulo: string;
  descricao: string;
  prioridade: PrioridadeAlerta;
  quantidade?: number;
  rota?: string;
}

const LIMIAR_INADIMPLENCIA_CRITICA = 25;
const LIMIAR_INADIMPLENCIA_ALTA = 15;
const LIMIAR_BAIXA_FREQUENCIA = 50;
const MINIMO_AULAS_PARA_AVALIAR_FREQUENCIA = 3;
const JANELA_FREQUENCIA_DIAS = 30;

// Alertas calculados só a partir de dados reais (mensalidades, presenças,
// graduações) — não inclui nada de Metas/Eventos porque esses módulos
// ainda não têm backend próprio nesta fase (ver ADR pendente / roadmap).
// O front pode complementar essa lista com alertas derivados dos serviços
// mockados de Metas/Eventos, claramente identificados como tal.
export class GetAlertasDashboardService {
  async execute(unidadeId: number | null): Promise<AlertaDashboard[]> {
    const unidade = escopoUnidade(unidadeId);
    const alertas: AlertaDashboard[] = [];

    const [totalMensalidades, mensalidadesVencidas] = await Promise.all([
      prisma.mensalidade.count({ where: unidade }),
      prisma.mensalidade.count({
        where: { pago: false, vencimento: { lt: new Date() }, ...unidade },
      }),
    ]);

    if (mensalidadesVencidas > 0) {
      alertas.push({
        id: "mensalidades-vencidas",
        titulo: "Mensalidades vencidas",
        descricao: `${mensalidadesVencidas} mensalidade(s) vencida(s) e ainda não paga(s).`,
        prioridade: mensalidadesVencidas >= 10 ? "ALTA" : "MEDIA",
        quantidade: mensalidadesVencidas,
        rota: "/mensalidades",
      });
    }

    const taxaInadimplencia = totalMensalidades > 0 ? (mensalidadesVencidas / totalMensalidades) * 100 : 0;

    if (taxaInadimplencia >= LIMIAR_INADIMPLENCIA_ALTA) {
      alertas.push({
        id: "inadimplencia-elevada",
        titulo: "Inadimplência elevada",
        descricao: `${taxaInadimplencia.toFixed(1)}% das mensalidades geradas estão vencidas.`,
        prioridade: taxaInadimplencia >= LIMIAR_INADIMPLENCIA_CRITICA ? "CRITICA" : "ALTA",
        rota: "/financeiro",
      });
    }

    const desde = new Date();
    desde.setDate(desde.getDate() - JANELA_FREQUENCIA_DIAS);

    const presencasRecentes = await prisma.aulaAluno.findMany({
      where: { aula: { data: { gte: desde }, ...unidade } },
      select: { alunoId: true, presente: true, aluno: { select: { ativo: true } } },
    });

    const porAluno = new Map<number, { total: number; presente: number }>();
    presencasRecentes.forEach((registro) => {
      if (!registro.aluno.ativo) return;
      const atual = porAluno.get(registro.alunoId) ?? { total: 0, presente: 0 };
      atual.total += 1;
      if (registro.presente) atual.presente += 1;
      porAluno.set(registro.alunoId, atual);
    });

    const alunosBaixaFrequencia = Array.from(porAluno.values()).filter(
      (item) =>
        item.total >= MINIMO_AULAS_PARA_AVALIAR_FREQUENCIA &&
        (item.presente / item.total) * 100 < LIMIAR_BAIXA_FREQUENCIA
    ).length;

    if (alunosBaixaFrequencia > 0) {
      alertas.push({
        id: "alunos-baixa-frequencia",
        titulo: "Alunos com baixa frequência",
        descricao: `${alunosBaixaFrequencia} aluno(s) ativo(s) com frequência abaixo de ${LIMIAR_BAIXA_FREQUENCIA}% nos últimos ${JANELA_FREQUENCIA_DIAS} dias.`,
        prioridade: "MEDIA",
        quantidade: alunosBaixaFrequencia,
        rota: "/alunos",
      });
    }

    const alunosAtivos = await prisma.aluno.findMany({
      where: { ativo: true, ...unidade },
      select: { id: true },
    });

    const AULAS_POR_GRAU = 8;
    const presencasPorAluno = await prisma.aulaAluno.groupBy({
      by: ["alunoId"],
      where: { presente: true, alunoId: { in: alunosAtivos.map((a) => a.id) } },
      _count: { _all: true },
    });

    const proximosDaGraduacao = presencasPorAluno.filter((item) => {
      const faltam = AULAS_POR_GRAU - (item._count._all % AULAS_POR_GRAU);
      return faltam <= 2 && item._count._all > 0;
    }).length;

    if (proximosDaGraduacao > 0) {
      alertas.push({
        id: "alunos-proximos-graduacao",
        titulo: "Alunos próximos da graduação",
        descricao: `${proximosDaGraduacao} aluno(s) a até 2 aulas de evoluir de grau.`,
        prioridade: "BAIXA",
        quantidade: proximosDaGraduacao,
        rota: "/graduacoes/proximas",
      });
    }

    const ordemPrioridade: Record<PrioridadeAlerta, number> = { CRITICA: 0, ALTA: 1, MEDIA: 2, BAIXA: 3 };
    return alertas.sort((a, b) => ordemPrioridade[a.prioridade] - ordemPrioridade[b.prioridade]);
  }
}
