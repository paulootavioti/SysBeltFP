import { prismaDaRequisicao } from "../../../shared/database/prismaDaRequisicao";
import { AppError } from "../../../shared/errors/AppError";
import { garantirAcessoUnidade } from "../../../shared/utils/escopoUnidade";
import { AuditLogService } from "../../../shared/services/AuditLogService";

const auditLogService = new AuditLogService();

export class EstornarMensalidadeService {

  async execute(id: number, unidadeId: number | null, usuarioId: number, motivo: string) {
    const prisma = prismaDaRequisicao();

    const mensalidadeExistente = await prisma.mensalidade.findUnique({ where: { id } });

    if (!mensalidadeExistente) {
      throw new AppError("Mensalidade não encontrada.", 404);
    }

    garantirAcessoUnidade(unidadeId, mensalidadeExistente.unidadeId, "Mensalidade não encontrada.");

    if (mensalidadeExistente.status !== "PAGA") {
      throw new AppError("Só é possível estornar uma mensalidade paga.");
    }

    const mensalidade = await prisma.mensalidade.update({
      where: { id },
      data: {
        status: "ESTORNADA",
        estornadoEm: new Date(),
        motivoEstorno: motivo,
      },
    });

    await auditLogService.registrar({
      unidadeId: mensalidadeExistente.unidadeId,
      usuarioId,
      entidade: "Mensalidade",
      entidadeId: mensalidade.id,
      operacao: "ESTORNO",
      valoresAntes: mensalidadeExistente,
      valoresDepois: mensalidade,
    });

    return mensalidade;
  }
}
