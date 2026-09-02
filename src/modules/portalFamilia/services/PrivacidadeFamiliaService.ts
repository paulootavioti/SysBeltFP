import { prismaDaRequisicao } from "../../../shared/database/prismaDaRequisicao";
import { AppError } from "../../../shared/errors/AppError";

export class PrivacidadeFamiliaService {
  async listar(alunoId: number) {
    return prismaDaRequisicao().consentimento.findMany({
      where: { alunoId },
      orderBy: { createdAt: "desc" },
      include: { responsavel: { select: { nome: true } } },
    });
  }

  async revogar(consentimentoId: number, alunoIds: number[]) {
    const prisma = prismaDaRequisicao();
    const consentimento = await prisma.consentimento.findFirst({
      where: { id: consentimentoId, alunoId: { in: alunoIds }, revogadoEm: null },
    });
    if (!consentimento) throw new AppError("Consentimento não encontrado.", 404);

    return prisma.$transaction(async (tx) => {
      const revogado = await tx.consentimento.update({
        where: { id: consentimento.id },
        data: { revogadoEm: new Date(), observacao: "Revogado pelo Portal da Família." },
      });
      if (consentimento.tipo === "USO_IMAGEM") {
        await tx.aluno.update({ where: { id: consentimento.alunoId }, data: { autorizaUsoImagem: false } });
      }
      await tx.auditLog.create({
        data: {
          unidadeId: consentimento.unidadeId,
          entidade: "Consentimento",
          entidadeId: consentimento.id,
          operacao: "REVOGACAO_PORTAL_FAMILIA",
          valoresAntes: { revogadoEm: null },
          valoresDepois: { revogadoEm: revogado.revogadoEm },
          origemSistema: "portal-familia",
        },
      });
      return revogado;
    });
  }
}
