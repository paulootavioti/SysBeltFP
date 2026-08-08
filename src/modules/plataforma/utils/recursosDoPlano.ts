import { prisma } from "../../../shared/database/prisma";

// O que um plano da plataforma pode liberar. São os módulos que fazem
// sentido vender à parte porque têm custo ou complexidade própria — não é
// uma lista de telas, é uma lista de coisas que o assinante contrata.
export const RECURSOS_PLATAFORMA = [
  // Envio de mensagem por WhatsApp (régua de cobrança, aviso de entrada e
  // saída da criança, lembrete de aula). Custa por mensagem e exige número
  // e templates aprovados na Meta.
  "WHATSAPP",
  // Cobrança automática por gateway (PIX, cartão recorrente) em vez de
  // baixa manual.
  "GATEWAY_AUTOMATICO",
  // Catraca, leitor facial e registro de entrada/saída.
  "CONTROLE_ACESSO",
] as const;

export type RecursoPlataforma = (typeof RECURSOS_PLATAFORMA)[number];

export function ehRecursoConhecido(valor: string): valor is RecursoPlataforma {
  return (RECURSOS_PLATAFORMA as readonly string[]).includes(valor);
}

// Status em que a conta continua usando o que contratou. INADIMPLENTE está
// aqui de propósito: atraso de um dia não pode derrubar o WhatsApp nem a
// catraca da academia. Quem decide cortar é o operador, mudando o status
// pra SUSPENSA — um ato explícito, não um efeito colateral do vencimento.
const STATUS_COM_ACESSO = ["TESTE", "ATIVA", "INADIMPLENTE"];

/**
 * A conta tem direito a este recurso agora?
 *
 * Falha fechado: conta sem assinatura, com assinatura suspensa/cancelada,
 * ou inexistente, responde `false`. Nunca libera por omissão.
 */
export async function contaTemRecurso(
  contaId: number,
  recurso: RecursoPlataforma
): Promise<boolean> {
  const assinatura = await prisma.assinaturaPlataforma.findUnique({
    where: { contaId },
    select: { status: true, plano: { select: { recursos: true } } },
  });

  if (!assinatura) return false;
  if (!STATUS_COM_ACESSO.includes(assinatura.status)) return false;

  return assinatura.plano.recursos.includes(recurso);
}

/**
 * Mesma pergunta, a partir de uma unidade — que é o que os módulos têm em
 * mãos hoje (`req.user.unidadeId`).
 */
export async function unidadeTemRecurso(
  unidadeId: number,
  recurso: RecursoPlataforma
): Promise<boolean> {
  const unidade = await prisma.unidade.findUnique({
    where: { id: unidadeId },
    select: { contaId: true },
  });

  if (!unidade) return false;

  return contaTemRecurso(unidade.contaId, recurso);
}
