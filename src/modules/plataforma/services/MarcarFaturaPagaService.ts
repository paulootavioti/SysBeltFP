import { prisma } from "../../../shared/database/prisma";
import { AppError } from "../../../shared/errors/AppError";

// Baixa manual da fatura da plataforma. Quando a cobrança automática
// entrar, o webhook do gateway chama este mesmo serviço — o efeito de
// "fatura paga" precisa ter um caminho só.
export class MarcarFaturaPagaService {
  async execute(faturaId: number, pagaEm: Date = new Date()) {
    const fatura = await prisma.faturaPlataforma.findUnique({ where: { id: faturaId } });

    if (!fatura) {
      throw new AppError("Fatura não encontrada.", 404);
    }

    if (fatura.status === "CANCELADA") {
      throw new AppError("Esta fatura foi cancelada e não pode ser baixada.");
    }

    // Já paga: não sobrescreve a data original. Repetir a baixa (webhook
    // reenviado, dois cliques) não pode reescrever quando o dinheiro entrou.
    if (fatura.status === "PAGA") {
      return fatura;
    }

    const atualizada = await prisma.faturaPlataforma.update({
      where: { id: faturaId },
      data: { status: "PAGA", pagaEm },
    });

    // Assinante que estava em atraso volta a ficar em dia quando não sobra
    // nenhuma fatura vencida em aberto.
    await this.reativarSeQuitou(fatura.assinaturaId);

    return atualizada;
  }

  private async reativarSeQuitou(assinaturaId: number) {
    const assinatura = await prisma.assinaturaPlataforma.findUnique({
      where: { id: assinaturaId },
      select: { status: true },
    });

    if (assinatura?.status !== "INADIMPLENTE") return;

    const emAberto = await prisma.faturaPlataforma.count({
      where: { assinaturaId, status: "ABERTA", vencimento: { lt: new Date() } },
    });

    if (emAberto === 0) {
      await prisma.assinaturaPlataforma.update({
        where: { id: assinaturaId },
        data: { status: "ATIVA" },
      });
    }
  }
}
