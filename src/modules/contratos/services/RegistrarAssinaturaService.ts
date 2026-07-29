import { prisma } from "../../../shared/database/prisma";
import { AppError } from "../../../shared/errors/AppError";
import { garantirAcessoUnidade } from "../../../shared/utils/escopoUnidade";
import { AuditLogService } from "../../../shared/services/AuditLogService";

type TipoAssinatura = "DIGITAL" | "ELETRONICA" | "PRESENCIAL";

interface RegistrarAssinaturaDTO {
  tipoAssinatura: TipoAssinatura;
  contratoAssinadoUrl?: string | null;
}

const auditLogService = new AuditLogService();

// Estrutura inicial pedida pelo produto: registra que o contrato foi
// assinado (digital, eletrônica ou presencial em tablet/computador) e
// guarda o upload do contrato assinado — a integração com uma
// plataforma de assinatura eletrônica de verdade fica pra uma fase
// futura (aqui é só o registro manual feito pelo administrador).
export class RegistrarAssinaturaService {
  async execute(id: number, unidadeId: number | null, usuarioId: number, data: RegistrarAssinaturaDTO) {
    const contrato = await prisma.contrato.findUnique({ where: { id } });

    if (!contrato) {
      throw new AppError("Contrato não encontrado.");
    }

    garantirAcessoUnidade(unidadeId, contrato.unidadeId, "Contrato não encontrado.");

    if (contrato.situacao !== "PENDENTE_ASSINATURA") {
      throw new AppError("Só é possível registrar a assinatura de um contrato pendente de assinatura.");
    }

    const contratoAtualizado = await prisma.contrato.update({
      where: { id },
      data: {
        situacao: "ASSINADO",
        tipoAssinatura: data.tipoAssinatura,
        contratoAssinadoUrl: data.contratoAssinadoUrl ?? null,
        assinadoEm: new Date(),
      },
    });

    await auditLogService.registrar({
      unidadeId: contrato.unidadeId,
      usuarioId,
      entidade: "Contrato",
      entidadeId: contrato.id,
      operacao: "ATUALIZACAO",
      valoresAntes: contrato,
      valoresDepois: contratoAtualizado,
    });

    return contratoAtualizado;
  }
}
