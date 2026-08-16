import { prismaDaRequisicao } from "../../../shared/database/prismaDaRequisicao";
import { escopoUnidade } from "../../../shared/utils/escopoUnidade";
import { LIMITE_PADRAO_LISTAGEM } from "../../../shared/constants/pagination";

export interface ConversaFamiliaResumo {
  aluno: { id: number; nome: string; apelido: string | null; fotoUrl: string | null };
  ultimaMensagem: string;
  ultimaMensagemEm: Date;
  ultimoRemetenteTipo: string;
  naoLidas: number;
}

// Inbox da equipe: uma linha por aluno com conversa, ordenada pela mais
// recente primeiro, com o total de mensagens da FAMÍLIA ainda não lidas.
// Olha só as últimas LIMITE_PADRAO_LISTAGEM mensagens da unidade — pensado
// pra "o que está acontecendo agora", não um arquivo histórico completo.
export class ListConversasFamiliaService {
  async execute(unidadeId: number | null): Promise<ConversaFamiliaResumo[]> {
    const prisma = prismaDaRequisicao();
    const mensagens = await prisma.mensagemFamilia.findMany({
      where: escopoUnidade(unidadeId),
      orderBy: { createdAt: "desc" },
      take: LIMITE_PADRAO_LISTAGEM,
      include: {
        aluno: { select: { id: true, nome: true, apelido: true, fotoUrl: true } },
      },
    });

    const porAluno = new Map<number, ConversaFamiliaResumo>();

    for (const mensagem of mensagens) {
      let conversa = porAluno.get(mensagem.alunoId);

      if (!conversa) {
        conversa = {
          aluno: mensagem.aluno,
          ultimaMensagem: mensagem.texto,
          ultimaMensagemEm: mensagem.createdAt,
          ultimoRemetenteTipo: mensagem.remetenteTipo,
          naoLidas: 0,
        };
        porAluno.set(mensagem.alunoId, conversa);
      }

      if (mensagem.remetenteTipo === "FAMILIA" && !mensagem.lida) {
        conversa.naoLidas += 1;
      }
    }

    // `mensagens` já veio ordenada da mais recente pra mais antiga, e o
    // Map preserva a ordem de inserção — não precisa reordenar de novo.
    return Array.from(porAluno.values());
  }
}
