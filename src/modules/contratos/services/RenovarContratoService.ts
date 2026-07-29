import { prisma } from "../../../shared/database/prisma";
import { AppError } from "../../../shared/errors/AppError";
import { garantirAcessoUnidade } from "../../../shared/utils/escopoUnidade";
import { AuditLogService } from "../../../shared/services/AuditLogService";
import { gerarConteudoContrato } from "../utils/gerarConteudoContrato";

interface RenovarContratoDTO {
  usuarioId: number;
  dataInicioVigencia?: string;
  dataFimVigencia?: string | null;
  valor?: number;
}

const SITUACOES_RENOVAVEIS = ["ATIVO", "SUSPENSO", "ENCERRADO"];
const auditLogService = new AuditLogService();

// Gera um novo contrato (RASCUNHO) encadeado ao atual via
// contratoAnteriorId, copiando modelo/plano/forma de pagamento/valor, e
// marca o contrato de origem como RENOVADO — usado tanto pela renovação
// manual (aqui) quanto pela automática (RenovarContratosVencidosService).
export class RenovarContratoService {
  async execute(id: number, unidadeId: number | null, data: RenovarContratoDTO) {
    const contratoAtual = await prisma.contrato.findUnique({ where: { id } });

    if (!contratoAtual) {
      throw new AppError("Contrato não encontrado.");
    }

    garantirAcessoUnidade(unidadeId, contratoAtual.unidadeId, "Contrato não encontrado.");

    if (!SITUACOES_RENOVAVEIS.includes(contratoAtual.situacao)) {
      throw new AppError(`Um contrato com situação ${contratoAtual.situacao} não pode ser renovado.`);
    }

    const dataInicioVigencia =
      data.dataInicioVigencia ||
      contratoAtual.dataFimVigencia?.toISOString() ||
      new Date().toISOString();

    const valor = data.valor ?? contratoAtual.valor;

    const { conteudoGerado, contratanteResponsavelId } = await gerarConteudoContrato({
      unidadeId: contratoAtual.unidadeId,
      alunoId: contratoAtual.alunoId,
      modeloContratoId: contratoAtual.modeloContratoId,
      planoId: contratoAtual.planoId,
      formaPagamentoId: contratoAtual.formaPagamentoId,
      valor,
      dataFimVigencia: data.dataFimVigencia,
    });

    const ultimoContrato = await prisma.contrato.findFirst({
      where: { unidadeId: contratoAtual.unidadeId },
      orderBy: { numero: "desc" },
      select: { numero: true },
    });

    const numero = (ultimoContrato?.numero ?? 0) + 1;

    const [contratoRenovado] = await prisma.$transaction([
      prisma.contrato.create({
        data: {
          unidadeId: contratoAtual.unidadeId,
          numero,
          alunoId: contratoAtual.alunoId,
          contratanteResponsavelId,
          modeloContratoId: contratoAtual.modeloContratoId,
          planoId: contratoAtual.planoId,
          formaPagamentoId: contratoAtual.formaPagamentoId,
          valor,
          dataInicioVigencia: new Date(dataInicioVigencia),
          dataFimVigencia: data.dataFimVigencia ? new Date(data.dataFimVigencia) : null,
          regrasCancelamento: contratoAtual.regrasCancelamento,
          clausulas: contratoAtual.clausulas,
          conteudoGerado,
          renovacaoAutomatica: contratoAtual.renovacaoAutomatica,
          contratoAnteriorId: contratoAtual.id,
        },
      }),
      prisma.contrato.update({
        where: { id: contratoAtual.id },
        data: { situacao: "RENOVADO" },
      }),
    ]);

    await auditLogService.registrar({
      unidadeId: contratoAtual.unidadeId,
      usuarioId: data.usuarioId,
      entidade: "Contrato",
      entidadeId: contratoRenovado.id,
      operacao: "CRIACAO",
      valoresAntes: { renovadoDoContratoId: contratoAtual.id },
      valoresDepois: contratoRenovado,
    });

    return contratoRenovado;
  }
}
