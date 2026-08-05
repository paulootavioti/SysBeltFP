import { prisma } from "../../../shared/database/prisma";
import { escopoUnidade } from "../../../shared/utils/escopoUnidade";

interface Solicitante {
  id: number;
  perfil: string;
  unidadeId: number | null;
}

interface Filtros {
  alunoId?: number;
  dispositivoId?: number;
  autorizado?: boolean;
  limite?: number;
}

const LIMITE_PADRAO = 100;
const LIMITE_MAXIMO = 500;

export class ListEventosAcessoService {
  async execute(solicitante: Solicitante, filtros: Filtros = {}) {
    const limite = Math.min(filtros.limite ?? LIMITE_PADRAO, LIMITE_MAXIMO);

    return prisma.eventoAcesso.findMany({
      where: {
        ...escopoUnidade(solicitante.unidadeId),
        ...(filtros.alunoId ? { alunoId: filtros.alunoId } : {}),
        ...(filtros.dispositivoId ? { dispositivoId: filtros.dispositivoId } : {}),
        ...(filtros.autorizado !== undefined ? { autorizado: filtros.autorizado } : {}),
      },
      include: {
        aluno: { select: { id: true, nome: true, apelido: true } },
        usuario: { select: { id: true, nome: true } },
        dispositivo: { select: { id: true, nome: true, localizacao: true } },
      },
      orderBy: { ocorridoEm: "desc" },
      take: limite,
    });
  }
}
