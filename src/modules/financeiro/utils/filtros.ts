import type { Prisma } from "@prisma/client";

import { escopoUnidade } from "../../../shared/utils/escopoUnidade";
import { calcularRangePeriodo, type Periodo } from "../../dashboard/utils/periodo";

export interface FiltrosFinanceiro {
  periodo?: Periodo;
  unidadeId?: number;
  professorId?: number;
}

// Monta o `where` de Mensalidade a partir dos filtros de período/unidade/
// professor pedidos pelo produto. O filtro de unidade só tem efeito pro
// SUPERADMIN (escopo nulo) — um ADMIN/RECEPCAO já está preso à própria
// unidade por `escopoUnidade`, então um `unidadeId` de outra unidade nesse
// caso é simplesmente ignorado (nunca vaza dado de outra unidade).
export function montarWhereMensalidade(
  unidadeIdUsuario: number | null,
  filtros: FiltrosFinanceiro
): Prisma.MensalidadeWhereInput {
  const where: Prisma.MensalidadeWhereInput = { ...escopoUnidade(unidadeIdUsuario) };

  if (unidadeIdUsuario === null && filtros.unidadeId) {
    where.unidadeId = filtros.unidadeId;
  }

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
