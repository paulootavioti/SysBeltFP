import { Prisma } from "@prisma/client";

export const aulaIncludeCompleto = {
  turma: true,
  aulaCurriculo: {
    include: {
      tecnicas: true,
      blocos: { orderBy: { ordem: "asc" as const } },
    },
  },
  tecnicasRealizadas: true,
  execucoesBlocos: { orderBy: { ordem: "asc" as const } },
  alunos: {
    include: {
      aluno: {
        include: {
          graduacoes: {
            where: { status: "aprovada" },
            orderBy: { data: "desc" as const },
            take: 1,
            select: { cor: true },
          },
          responsaveis: {
            where: { ativo: true },
            select: {
              id: true,
              nome: true,
              apelido: true,
              telefone: true,
              whatsapp: true,
              parentesco: true,
              recebeComunicados: true,
            },
          },
        },
      },
    },
    orderBy: {
      aluno: {
        nome: "asc",
      },
    },
  },
} satisfies Prisma.AulaInclude;
