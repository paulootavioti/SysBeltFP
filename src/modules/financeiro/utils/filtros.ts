import type { Prisma } from "@prisma/client";

import { escopoUnidadeFiltrada } from "../../../shared/utils/escopoUnidade";
import { calcularRangePeriodo, type Periodo } from "../../dashboard/utils/periodo";

export interface FiltrosFinanceiro {
  periodo?: Periodo;
  unidadeId?: number;
  professorId?: number;
}

// Monta o `where` de Mensalidade a partir dos filtros de período/unidade/
// professor pedidos pelo produto.
//
// O filtro de unidade só estreita dentro do alcance de quem pergunta: um
// ADMIN/RECEPCAO já está preso à própria unidade, e o DONO (RN-164) escolhe
// entre as filiais da conta dele. Uma unidade fora do alcance é ignorada —
// antes ela sobrescrevia o escopo e lia o financeiro de outra academia.
export function montarWhereMensalidade(
  unidadeIdUsuario: number | null,
  filtros: FiltrosFinanceiro
): Prisma.MensalidadeWhereInput {
  const where: Prisma.MensalidadeWhereInput = {
    ...escopoUnidadeFiltrada(unidadeIdUsuario, filtros.unidadeId),
  };

  if (filtros.periodo) {
    const range = calcularRangePeriodo(filtros.periodo);
    where.vencimento = { gte: range.inicio, lt: range.fim };
  }

  if (filtros.professorId) {
    where.aluno = { turma: { professorId: filtros.professorId } };
  }

  return where;
}

export function lerFiltrosDaQuery(query: Record<string, unknown>): FiltrosFinanceiro {
  const periodo = typeof query.periodo === "string" ? (query.periodo as Periodo) : undefined;
  const unidadeId = query.unidadeId ? Number(query.unidadeId) : undefined;
  const professorId = query.professorId ? Number(query.professorId) : undefined;

  return {
    periodo: periodo && ["DIARIO", "SEMANAL", "MENSAL", "ANUAL"].includes(periodo) ? periodo : undefined,
    unidadeId: unidadeId && Number.isInteger(unidadeId) ? unidadeId : undefined,
    professorId: professorId && Number.isInteger(professorId) ? professorId : undefined,
  };
}
