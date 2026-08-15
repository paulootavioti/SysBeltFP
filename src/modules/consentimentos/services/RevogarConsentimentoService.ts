import { prismaDaRequisicao } from "../../../shared/database/prismaDaRequisicao";
import { AppError } from "../../../shared/errors/AppError";
import { garantirAcessoUnidade } from "../../../shared/utils/escopoUnidade";
import { AuditLogService } from "../../../shared/services/AuditLogService";

const auditLogService = new AuditLogService();

// Revogar não apaga a linha: marca quando e por quem, porque a revogação
// também é um fato que precisa ficar registrado (LGPD, art. 8º, §5º).
export class RevogarConsentimentoService {
  async execute(id: number, unidadeId: number | null, revogadoPorId: number) {
    const prisma = prismaDaRequisicao();
    const consentimento = await prisma.consentimento.findUnique({ where: { id } });

    if (!consentimento) {
      throw new AppError("Consentimento não encontrado.", 404);
    }

    garantirAcessoUnidade(unidadeId, consentimento.unidadeId, "Consentimento não encontrado.");

    if (consentimento.revogadoEm) {
      throw new AppError("Este consentimento já foi revogado.");
    }

    const revogado = await prisma.consentimento.update({
      where: { id },
      data: { revogadoEm: new Date(), revogadoPorId },
    });

    // sem consentimento de imagem vigente, a foto do aluno não pode mais
    // ser publicada — a projeção acompanha a revogação na hora.
    if (consentimento.tipo === "USO_IMAGEM") {
      await prisma.aluno.update({
        where: { id: consentimento.alunoId },
        data: { autorizaUsoImagem: false },
      });
    }

    await auditLogService.registrar({
      unidadeId: consentimento.unidadeId,
      usuarioId: revogadoPorId,
      entidade: "Consentimento",
      entidadeId: id,
      operacao: "REVOGACAO_CONSENTIMENTO",
      valoresAntes: { concedido: consentimento.concedido, revogadoEm: null },
      valoresDepois: { revogadoEm: revogado.revogadoEm },
    });

    return revogado;
  }
}
