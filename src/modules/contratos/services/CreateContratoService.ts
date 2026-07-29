import { prisma } from "../../../shared/database/prisma";
import { AuditLogService } from "../../../shared/services/AuditLogService";
import { gerarConteudoContrato } from "../utils/gerarConteudoContrato";

interface CreateContratoDTO {
  unidadeId: number;
  usuarioId: number;
  alunoId: number;
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

export class CreateContratoService {
  async execute(data: CreateContratoDTO) {
    const { conteudoGerado, contratanteResponsavelId } = await gerarConteudoContrato(data);

    const ultimoContrato = await prisma.contrato.findFirst({
      where: { unidadeId: data.unidadeId },
      orderBy: { numero: "desc" },
      select: { numero: true },
    });

    const numero = (ultimoContrato?.numero ?? 0) + 1;

    const contrato = await prisma.contrato.create({
      data: {
        unidadeId: data.unidadeId,
        numero,
        alunoId: data.alunoId,
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
      unidadeId: data.unidadeId,
      usuarioId: data.usuarioId,
      entidade: "Contrato",
      entidadeId: contrato.id,
      operacao: "CRIACAO",
      valoresDepois: contrato,
    });

    return contrato;
  }
}
