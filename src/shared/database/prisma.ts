// src/shared/database/prisma.ts

import { PrismaClient } from "@prisma/client";

// omite por padrão o hash de senha do Portal da Família de toda resposta —
// só LoginFamiliaService precisa lê-lo, e faz isso com "omit: { senhaPortal: false }"
// pra sobrescrever o padrão pontualmente nessa consulta.
export const prisma = new PrismaClient({
  omit: {
    responsavel: { senhaPortal: true },
    aluno: { senhaPortal: true },
  },
});