import { prismaDaRequisicao } from "../../../shared/database/prismaDaRequisicao";
import { LIMITE_PADRAO_LISTAGEM } from "../../../shared/constants/pagination";
import { escopoUnidade } from "../../../shared/utils/escopoUnidade";
import type { Prisma } from "@prisma/client";

export class ListAlunosService {
  async execute(unidadeId: number | null, perfil?: string): Promise<any[]>;
  async execute(
    unidadeId: number | null,
    perfil: string | undefined,
    paginacao: { pagina: number; porPagina: number; busca?: string; status?: string; turmaId?: number },
  ): Promise<{ itens: any[]; pagina: number; porPagina: number; total: number; totalPaginas: number }>;
  async execute(
    unidadeId: number | null,
    perfil?: string,
    paginacao?: { pagina: number; porPagina: number; busca?: string; status?: string; turmaId?: number },
  ): Promise<any> {
    const prisma = prismaDaRequisicao();

    // O aluno pode estar autorizado em mais de uma unidade (AlunoUnidade),
    // então o escopo entra pela junção. Sem alcance no `where` (rotina
    // interna) a listagem continua sendo do tenant inteiro.
    const alcance = escopoUnidade(unidadeId);
    const escopoAluno =
      alcance.unidadeId === undefined ? {} : { unidadesPermitidas: { some: alcance } };

    // PROFESSOR só pode VER: nome, apelido, nome do responsável e turma —
    // nada de CPF, endereço, saúde ou financeiro do aluno. `ativo` e
    // `dataNascimento` também vêm, mas só de apoio interno (filtrar alunos
    // ativos, calcular a trilha de faixa ao registrar graduação) — nenhuma
    // tela do Professor exibe esses dois campos.
    if (perfil === "PROFESSOR") {
      const whereProfessor: Prisma.AlunoWhereInput = {
        ...escopoAluno,
        ativo: true,
        ...(paginacao?.busca ? { OR: [
          { nome: { contains: paginacao.busca, mode: "insensitive" as const } },
          { apelido: { contains: paginacao.busca, mode: "insensitive" as const } },
        ] } : {}),
        ...(paginacao?.turmaId ? { turmaId: paginacao.turmaId } : {}),
      };
      const consultaProfessor: Prisma.AlunoFindManyArgs = {
        where: whereProfessor,
        take: paginacao?.porPagina ?? LIMITE_PADRAO_LISTAGEM,
        ...(paginacao ? { skip: (paginacao.pagina - 1) * paginacao.porPagina } : {}),
        orderBy: { nome: "asc" },
        select: {
          id: true,
          nome: true,
          apelido: true,
          ativo: true,
          dataNascimento: true,
          turma: { select: { id: true, nome: true } },
          responsaveis: { select: { id: true, nome: true } },
        },
      };
      if (paginacao) {
        const [itens, total] = await prisma.$transaction([
          prisma.aluno.findMany(consultaProfessor),
          prisma.aluno.count({ where: whereProfessor }),
        ]);
        return { itens, pagina: paginacao.pagina, porPagina: paginacao.porPagina, total, totalPaginas: Math.max(1, Math.ceil(total / paginacao.porPagina)) };
      }
      return prisma.aluno.findMany(consultaProfessor);
    }

    const filtros: Prisma.AlunoWhereInput = {
      ...escopoAluno,
      ...(paginacao?.busca
        ? { OR: [
            { nome: { contains: paginacao.busca, mode: "insensitive" as const } },
            { apelido: { contains: paginacao.busca, mode: "insensitive" as const } },
          ] }
        : {}),
      ...(paginacao?.status === "ATIVO" ? { ativo: true } : {}),
      ...(paginacao?.status === "INATIVO" ? { ativo: false } : {}),
      ...(paginacao?.turmaId ? { turmaId: paginacao.turmaId } : {}),
    };

    const consulta: Prisma.AlunoFindManyArgs = {
        where: filtros,
        take: paginacao?.porPagina ?? LIMITE_PADRAO_LISTAGEM,
        ...(paginacao ? { skip: (paginacao.pagina - 1) * paginacao.porPagina } : {}),
        orderBy: {
          nome: "asc" as const,
        },
        include: {
          unidadesPermitidas: { select: { unidadeId: true } },
          turma: { select: { id: true, nome: true } },
          responsaveis: { select: { id: true, nome: true } },
          mensalidades: {
            orderBy: {
              vencimento: "desc" as const,
            },
            take: 1,
          },
          graduacoes: {
            where: { status: "aprovada" },
            orderBy: { data: "desc" as const },
            take: 1,
            select: { cor: true },
          },
        }
      };

    if (paginacao) {
      const [itens, total] = await prisma.$transaction([
        prisma.aluno.findMany(consulta),
        prisma.aluno.count({ where: filtros }),
      ]);
      return {
        itens: itens.map(({ graduacoes, ...aluno }) => ({ ...aluno, faixaCor: graduacoes[0]?.cor ?? null })),
        pagina: paginacao.pagina,
        porPagina: paginacao.porPagina,
        total,
        totalPaginas: Math.max(1, Math.ceil(total / paginacao.porPagina)),
      };
    }

    const alunos = await prisma.aluno.findMany(consulta);
    return alunos.map(({ graduacoes, ...aluno }) => ({ ...aluno, faixaCor: graduacoes[0]?.cor ?? null }));
  }
}
