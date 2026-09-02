import { prismaDaRequisicao } from "../../../shared/database/prismaDaRequisicao";
import { AppError } from "../../../shared/errors/AppError";
import { PagarPedidoFamiliaService } from "./PagarPedidoFamiliaService";

interface ItemCarrinhoDTO { varianteId: number; quantidade: number }

export class CriarPedidoFamiliaService {
  async execute(alunoId: number, itens: ItemCarrinhoDTO[], formaPagamentoId?: number | null) {
    const prisma = prismaDaRequisicao();
    if (itens.length === 0) throw new AppError("O carrinho está vazio.");
    const aluno = await prisma.aluno.findUnique({ where: { id: alunoId } });
    if (!aluno) throw new AppError("Aluno não encontrado.", 404);

    const varianteIds = [...new Set(itens.map((item) => item.varianteId))];
    if (varianteIds.length !== itens.length) throw new AppError("Há itens duplicados no carrinho.");
    const variantes = await prisma.produtoVariante.findMany({ where: { id: { in: varianteIds } }, include: { produto: true } });
    for (const item of itens) {
      const variante = variantes.find((v) => v.id === item.varianteId);
      if (!variante || !variante.produto.ativo) throw new AppError("Produto não encontrado.", 404);
      if (item.quantidade <= 0) throw new AppError(`Quantidade inválida para ${variante.produto.nome}.`);
      if (variante.estoque < item.quantidade) throw new AppError(`Estoque insuficiente para ${variante.produto.nome}.`);
    }

    const unidades = new Set(variantes.map((v) => v.produto.unidadeId));
    if (unidades.size > 1) throw new AppError("O carrinho tem produtos de unidades diferentes. Finalize uma unidade por vez.");
    const unidadeId = [...unidades][0];
    if (formaPagamentoId && !await prisma.formaPagamento.findFirst({ where: { id: formaPagamentoId, unidadeId, ativo: true } })) {
      throw new AppError("Forma de pagamento não disponível para esta unidade.");
    }
    const total = itens.reduce((soma, item) => soma + variantes.find((v) => v.id === item.varianteId)!.produto.preco * item.quantidade, 0);

    const pedido = await prisma.$transaction(async (tx) => {
      const criado = await tx.pedido.create({
        data: {
          unidadeId, alunoId, formaPagamentoId: formaPagamentoId ?? null, total, status: "AGUARDANDO_PAGAMENTO",
          itens: { create: itens.map((item) => ({
            varianteId: item.varianteId, quantidade: item.quantidade,
            precoUnitario: variantes.find((v) => v.id === item.varianteId)!.produto.preco,
          })) },
        },
      });
      for (const item of itens) {
        const atualizado = await tx.produtoVariante.updateMany({
          where: { id: item.varianteId, estoque: { gte: item.quantidade } }, data: { estoque: { decrement: item.quantidade } },
        });
        if (atualizado.count !== 1) throw new AppError("O estoque mudou durante a compra. Revise o carrinho.");
        await tx.movimentacaoEstoque.create({ data: {
          varianteId: item.varianteId, tipo: "SAIDA", quantidade: item.quantidade, motivo: `Reserva - Pedido #${criado.id}`,
        } });
      }
      return criado;
    });
    return new PagarPedidoFamiliaService().execute(pedido.id, alunoId);
  }
}
