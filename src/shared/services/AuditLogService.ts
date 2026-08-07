import type { Prisma } from "@prisma/client";

import { prisma } from "../database/prisma";
import { obterContextoRequisicao } from "../context/contextoRequisicao";

export type OperacaoAuditoria =
  | "CRIACAO"
  | "ATUALIZACAO"
  | "CANCELAMENTO"
  | "ESTORNO"
  | "PAGAMENTO"
  | "EXCLUSAO"
  // leitura de dado sensível (ficha médica, prontuário) — o requisito de
  // auditoria pede registrar o que foi VISUALIZADO, não só alterado.
  | "CONSULTA_SENSIVEL"
  | "CONSENTIMENTO"
  | "REVOGACAO_CONSENTIMENTO";

interface RegistrarAuditoriaDTO {
  unidadeId: number;
  // opcional: quando omitido, sai do contexto da requisição. Isso permite
  // auditar services que nunca receberam usuarioId por parâmetro.
  usuarioId?: number;
  // Preencher quando a operação não parte de uma pessoa (webhook, cron):
  // sem isso a ação mais silenciosa do sistema seria a menos rastreável.
  origemSistema?: string;
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

// Auditoria genérica de alterações sensíveis — todo service
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
    origemSistema,
  }: RegistrarAuditoriaDTO) {
    const contexto = obterContextoRequisicao();
    const autor = usuarioId ?? contexto.usuarioId ?? null;

    try {
      return await prisma.auditLog.create({
        data: {
          unidadeId,
          usuarioId: autor,
          origemSistema: autor ? null : (origemSistema ?? "sistema"),
          entidade,
          entidadeId,
          operacao,
          valoresAntes: paraJson(valoresAntes),
          valoresDepois: paraJson(valoresDepois),
          // IP e dispositivo vêm do contexto da requisição — nenhum
          // service precisa recebê-los nem lembrar de repassá-los.
          ip: contexto.ip,
          dispositivo: contexto.dispositivo,
        },
      });
    } catch (error) {
      console.error("Falha ao registrar auditoria:", error);
      return null;
    }
  }
}
