import { prisma } from "../../../shared/database/prisma";
import { calcularRangePeriodo, type Periodo } from "../utils/periodo";

export interface UnidadeDashboard {
  id: number;
  nome: string;
  tipo: "UNIDADE";
  alunosAtivos: number;
  professores: number;
  turmasAtivas: number;
  receitaPeriodo: number;
  mensalidadesVencidas: number;
  taxaFrequencia: number;
  status: "ATIVA" | "INATIVA";
}

// Resumo por unidade pro painel "Unidades e Arenas" do dashboard.
// SUPERADMIN (unidadeId null) vê todas; qualquer outro perfil só vê a
// própria unidade ativa (mesma regra de escopo do resto do sistema).
//
// Não existe hoje um status "EM_IMPLANTACAO" no schema (só o booleano
// `Unidade.ativo`), nem um conceito de "Arena" com métricas próprias
// equivalentes às de Unidade — por isso este resumo é só por Unidade,
// e o tipo de status é um subconjunto do sugerido originalmente.
export class GetResumoUnidadesService {
  async execute(unidadeId: number | null, periodo: Periodo = "MENSAL"): Promise<UnidadeDashboard[]> {
    const range = calcularRangePeriodo(periodo);
    const hoje = new Date();

    const unidades = await prisma.unidade.findMany({
      where: unidadeId === null ? {} : { id: unidadeId },
      orderBy: { nome: "asc" },
    });

    return Promise.all(
      unidades.map(async (unidade): Promise<UnidadeDashboard> => {
        const [alunosAtivos, turmasAtivas, professoresDistintos, receita, mensalidadesVencidas, presencas] =
          await Promise.all([
            prisma.aluno.count({ where: { unidadeId: unidade.id, ativo: true } }),
            prisma.turma.count({ where: { unidadeId: unidade.id, ativo: true } }),
            prisma.turma.findMany({
              where: { unidadeId: unidade.id, professorId: { not: null } },
              select: { professorId: true },
              distinct: ["professorId"],
            }),
            prisma.mensalidade.aggregate({
              where: {
                unidadeId: unidade.id,
                pago: true,
                dataPagamento: { gte: range.inicio, lt: range.fim },
              },
              _sum: { valor: true },
            }),
            prisma.mensalidade.count({
              where: { unidadeId: unidade.id, pago: false, vencimento: { lt: hoje } },
            }),
            prisma.aulaAluno.findMany({
              where: { aula: { unidadeId: unidade.id, data: { gte: range.inicio, lt: range.fim } } },
              select: { presente: true },
            }),
          ]);

        const presentes = presencas.filter((p) => p.presente).length;
        const taxaFrequencia = presencas.length > 0 ? (presentes / presencas.length) * 100 : 0;

        return {
          id: unidade.id,
          nome: unidade.nome,
          tipo: "UNIDADE",
          alunosAtivos,
          professores: professoresDistintos.length,
          turmasAtivas,
          receitaPeriodo: receita._sum.valor ?? 0,
          mensalidadesVencidas,
          taxaFrequencia,
          status: unidade.ativo ? "ATIVA" : "INATIVA",
        };
      })
    );
  }
}
