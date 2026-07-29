import type { Prisma } from "@prisma/client";

import { prisma } from "../database/prisma";

export type OperacaoAuditoria =
  | "CRIACAO"
  | "ATUALIZACAO"
  | "CANCELAMENTO"
  | "ESTORNO"
  | "PAGAMENTO"
  | "EXCLUSAO";

interface RegistrarAuditoriaDTO {
  unidadeId: number;
  usuarioId: number;
  entidade: string;
  entidadeId: number;
  operacao: OperacaoAuditoria;
  valoresAntes?: unknown;
  valoresDepois?: unknown;
}

// Entidades do Prisma trazem campos Date/Decimal que o tipo Json do Prisma
// não aceita diretamente — serializa pra um JSON simples antes de gravar.
function paraJson(valor: unknown): Prisma.InputJsonValue | undefined {
  if (valor === null || valor === undefined) return undefined;
  return JSON.parse(JSON.stringify(valor)) as Prisma.InputJsonValue;
}

// Auditoria genérica de alterações financeiras/contratuais — todo service
// de escrita sensível (Mensalidade hoje; Contrato/Assinatura nas próximas
// fases) chama `registrar` depois de concluir a operação. Nunca deve
// interromper a operação principal por conta própria — falhas de
// auditoria são logadas, não propagadas.
export class AuditLogService {
  async registrar({
    unidadeId,
    usuarioId,
    entidade,
    entidadeId,
    operacao,
    valoresAntes,
    valoresDepois,
  }: RegistrarAuditoriaDTO) {
    try {
      return await prisma.auditLog.create({
        data: {
          unidadeId,
          usuarioId,
          entidade,
          entidadeId,
          operacao,
          valoresAntes: paraJson(valoresAntes),
          valoresDepois: paraJson(valoresDepois),
        },
      });
    } catch (error) {
      console.error("Falha ao registrar auditoria:", error);
      return null;
    }
  }
}
