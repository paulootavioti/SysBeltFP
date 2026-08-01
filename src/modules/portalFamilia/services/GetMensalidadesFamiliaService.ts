import { prisma } from "../../../shared/database/prisma";

export class GetMensalidadesFamiliaService {
  async execute(alunoId: number) {
    const mensalidades = await prisma.mensalidade.findMany({
      where: { alunoId },
      orderBy: { vencimento: "desc" },
    });

    return mensalidades.map((mensalidade) => ({
      id: mensalidade.id,
      descricao: mensalidade.descricao,
      valor: mensalidade.valorFinal || mensalidade.valor,
      vencimento: mensalidade.vencimento,
      dataPagamento: mensalidade.dataPagamento,
      status: mensalidade.status,
    }));
  }
}
