import { prisma } from "../../../shared/database/prisma";

// Quem recebe o aviso sobre um aluno.
//
// A regra vem da realidade da academia: a maioria dos alunos é criança, e
// quem tem WhatsApp é o responsável. Então a mensagem vai pro responsável
// quando ele existe e tem número; só cai no telefone do próprio aluno
// quando não há responsável cadastrado — que é o caso do aluno adulto.
//
// `whatsapp` tem precedência sobre `telefone` porque o cadastro tem os
// dois campos separados: quando alguém preencheu o campo WhatsApp, foi
// exatamente pra dizer "é neste que eu recebo".

export interface Destinatario {
  telefone: string;
  nome: string;
  responsavelId: number | null;
}

export async function destinatarioDoAluno(alunoId: number): Promise<Destinatario | null> {
  const aluno = await prisma.aluno.findUnique({
    where: { id: alunoId },
    select: {
      nome: true,
      telefone: true,
      whatsapp: true,
      responsaveis: {
        select: { id: true, nome: true, telefone: true, whatsapp: true },
        orderBy: { id: "asc" },
      },
    },
  });

  if (!aluno) return null;

  for (const responsavel of aluno.responsaveis) {
    const telefone = responsavel.whatsapp || responsavel.telefone;

    if (telefone) {
      return { telefone, nome: responsavel.nome, responsavelId: responsavel.id };
    }
  }

  const proprio = aluno.whatsapp || aluno.telefone;

  if (proprio) {
    return { telefone: proprio, nome: aluno.nome, responsavelId: null };
  }

  return null;
}

/** Primeiro nome, que é como se fala com alguém numa mensagem. */
export function primeiroNome(nome: string): string {
  return nome.trim().split(/\s+/)[0] ?? nome;
}
