import { prismaDaRequisicao } from "../../../shared/database/prismaDaRequisicao";
import { AppError } from "../../../shared/errors/AppError";
import { garantirAcessoUnidade } from "../../../shared/utils/escopoUnidade";
import { AuditLogService } from "../../../shared/services/AuditLogService";
import { TRANSICOES_MANUAIS } from "../utils/transicoesSituacaoContrato";

type SituacaoManual =
  | "RASCUNHO"
  | "PENDENTE_ASSINATURA"
  | "ATIVO"
  | "SUSPENSO"
  | "CANCELADO"
  | "ENCERRADO";

const auditLogService = new AuditLogService();

export class AlterarSituacaoContratoService {
  async execute(
    id: number,
    unidadeId: number | null,
    usuarioId: number,
    novaSituacao: SituacaoManual,
    motivoCancelamento?: string | null
  ) {
    const prisma = prismaDaRequisicao();
    const contrato = await prisma.contrato.findUnique({ where: { id } });

    if (!contrato) {
      throw new AppError("Contrato não encontrado.");
    }

    garantirAcessoUnidade(unidadeId, contrato.unidadeId, "Contrato não encontrado.");

    const transicoesPermitidas = TRANSICOES_MANUAIS[contrato.situacao] ?? [];

    if (!transicoesPermitidas.includes(novaSituacao)) {
      throw new AppError(
        `Não é possível mudar a situação de ${contrato.situacao} para ${novaSituacao}.`
      );
    }

    if (novaSituacao === "CANCELADO" && !motivoCancelamento) {
      throw new AppError("Informe o motivo do cancelamento.");
    }

    const contratoAtualizado = await prisma.contrato.update({
      where: { id },
      data: {
        situacao: novaSituacao,
        ...(novaSituacao === "CANCELADO"
          ? { canceladoEm: new Date(), motivoCancelamento }
          : {}),
        ...(novaSituacao === "ENCERRADO" ? { encerradoEm: new Date() } : {}),
      },
    });

    await auditLogService.registrar({
      unidadeId: contrato.unidadeId,
      usuarioId,
      entidade: "Contrato",
      entidadeId: contrato.id,
      operacao: novaSituacao === "CANCELADO" ? "CANCELAMENTO" : "ATUALIZACAO",
      valoresAntes: contrato,
      valoresDepois: contratoAtualizado,
    });

    return contratoAtualizado;
  }
}
