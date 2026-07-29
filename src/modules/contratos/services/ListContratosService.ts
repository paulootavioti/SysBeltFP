import { prisma } from "../../../shared/database/prisma";
import { escopoUnidade } from "../../../shared/utils/escopoUnidade";

interface ListContratosFiltros {
  alunoId?: number;
  situacao?: string;
}

export class ListContratosService {
  async execute(unidadeId: number | null, filtros: ListContratosFiltros = {}) {
    return prisma.contrato.findMany({
      where: {
        ...escopoUnidade(unidadeId),
        ...(filtros.alunoId ? { alunoId: filtros.alunoId } : {}),
        ...(filtros.situacao ? { situacao: filtros.situacao as never } : {}),
      },
      include: {
        aluno: { select: { id: true, nome: true } },
        contratanteResponsavel: { select: { id: true, nome: true } },
        modeloContrato: { select: { id: true, nome: true, versao: true } },
        plano: { select: { id: true, nome: true } },
      },
      orderBy: { numero: "desc" },
    });
  }
}
