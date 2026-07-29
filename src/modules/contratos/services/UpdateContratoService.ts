import { prisma } from "../../../shared/database/prisma";
import { AppError } from "../../../shared/errors/AppError";
import { garantirAcessoUnidade } from "../../../shared/utils/escopoUnidade";
import { AuditLogService } from "../../../shared/services/AuditLogService";
import { gerarConteudoContrato } from "../utils/gerarConteudoContrato";

interface UpdateContratoDTO {
  usuarioId: number;
  modeloContratoId: number;
  planoId?: number | null;
  formaPagamentoId?: number | null;
  valor: number;
  dataInicioVigencia: string;
  dataFimVigencia?: string | null;
  regrasCancelamento?: string | null;
  clausulas?: string | null;
  renovacaoAutomatica?: boolean;
}

const auditLogService = new AuditLogService();

// Só permite editar enquanto o contrato ainda está em RASCUNHO — depois
// de pendente de assinatura em diante, o conteúdo precisa ficar estável
// (alterações passam a ser feitas via renovação, gerando um novo
// contrato encadeado).
export class UpdateContratoService {
  async execute(id: number, unidadeId: number | null, data: UpdateContratoDTO) {
    const contratoAtual = await prisma.contrato.findUnique({ where: { id } });

    if (!contratoAtual) {
      throw new AppError("Contrato não encontrado.");
    }

    garantirAcessoUnidade(unidadeId, contratoAtual.unidadeId, "Contrato não encontrado.");

    if (contratoAtual.situacao !== "RASCUNHO") {
      throw new AppError("Só é possível editar um contrato enquanto ele está em rascunho.");
    }

    const { conteudoGerado, contratanteResponsavelId } = await gerarConteudoContrato({
      unidadeId: contratoAtual.unidadeId,
      alunoId: contratoAtual.alunoId,
      modeloContratoId: data.modeloContratoId,
      planoId: data.planoId,
      formaPagamentoId: data.formaPagamentoId,
      valor: data.valor,
      dataFimVigencia: data.dataFimVigencia,
    });

    const contrato = await prisma.contrato.update({
      where: { id },
      data: {
        contratanteResponsavelId,
        modeloContratoId: data.modeloContratoId,
        planoId: data.planoId ?? null,
        formaPagamentoId: data.formaPagamentoId ?? null,
        valor: data.valor,
        dataInicioVigencia: new Date(data.dataInicioVigencia),
        dataFimVigencia: data.dataFimVigencia ? new Date(data.dataFimVigencia) : null,
        regrasCancelamento: data.regrasCancelamento ?? null,
        clausulas: data.clausulas ?? null,
        conteudoGerado,
        renovacaoAutomatica: data.renovacaoAutomatica ?? false,
      },
    });

    await auditLogService.registrar({
      unidadeId: contratoAtual.unidadeId,
      usuarioId: data.usuarioId,
      entidade: "Contrato",
      entidadeId: contrato.id,
      operacao: "ATUALIZACAO",
      valoresAntes: contratoAtual,
      valoresDepois: contrato,
    });

    return contrato;
  }
}
