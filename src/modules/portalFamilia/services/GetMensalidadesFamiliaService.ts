import { prismaDaRequisicao } from "../../../shared/database/prismaDaRequisicao";

export class GetMensalidadesFamiliaService {
  async execute(alunoId: number) {
    const prisma = prismaDaRequisicao();
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
