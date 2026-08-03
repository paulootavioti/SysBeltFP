import { prisma } from "../../../shared/database/prisma";
import { AppError } from "../../../shared/errors/AppError";
import { obterGateway } from "../../pagamentos/gateways";
import { obterEmailService } from "../../../shared/services/EmailService";

interface ItemCarrinhoDTO {
  varianteId: number;
  quantidade: number;
}

// Checkout da Vitrine — mesmo estágio da PagarMensalidadeFamiliaService: só
// o gateway manual (NullPaymentGateway) está disponível, então o pedido já
// nasce confirmado (AGUARDANDO_RETIRADA) e o estoque é decrementado na
// hora. Quando um gateway de verdade existir, este service passa a
// aguardar a confirmação do pagamento antes de baixar o estoque, sem mudar
// a rota nem o frontend.
export class CriarPedidoFamiliaService {
  async execute(alunoId: number, itens: ItemCarrinhoDTO[]) {
    if (itens.length === 0) {
      throw new AppError("O carrinho está vazio.");
    }

    const aluno = await prisma.aluno.findUnique({ where: { id: alunoId } });

    if (!aluno) {
      throw new AppError("Aluno não encontrado.", 404);
    }

    const varianteIds = itens.map((item) => item.varianteId);
    const variantes = await prisma.produtoVariante.findMany({
      where: { id: { in: varianteIds } },
      include: { produto: true },
    });

    for (const item of itens) {
      const variante = variantes.find((v) => v.id === item.varianteId);

      if (!variante || variante.produto.unidadeId !== aluno.unidadeId || !variante.produto.ativo) {
        throw new AppError("Produto não encontrado.", 404);
      }

      if (item.quantidade <= 0) {
        throw new AppError(`Quantidade inválida para ${variante.produto.nome}.`);
      }

      if (variante.estoque < item.quantidade) {
        throw new AppError(
          `Estoque insuficiente para ${variante.produto.nome} (${variante.tamanho}${variante.cor ? ` · ${variante.cor}` : ""}).`
        );
      }
    }

    const total = itens.reduce((soma, item) => {
      const variante = variantes.find((v) => v.id === item.varianteId)!;
      return soma + variante.produto.preco * item.quantidade;
    }, 0);

    const pedido = await prisma.$transaction(async (tx) => {
      const novoPedido = await tx.pedido.create({
        data: {
          unidadeId: aluno.unidadeId,
          alunoId: aluno.id,
          total,
          itens: {
            create: itens.map((item) => {
              const variante = variantes.find((v) => v.id === item.varianteId)!;
              return {
                varianteId: item.varianteId,
                quantidade: item.quantidade,
                precoUnitario: variante.produto.preco,
              };
            }),
          },
        },
        include: { itens: { include: { variante: { include: { produto: true } } } } },
      });

      for (const item of itens) {
        await tx.produtoVariante.update({
          where: { id: item.varianteId },
          data: { estoque: { decrement: item.quantidade } },
        });

        await tx.movimentacaoEstoque.create({
          data: {
            varianteId: item.varianteId,
            tipo: "SAIDA",
            quantidade: item.quantidade,
            motivo: `Venda - Pedido #${novoPedido.id}`,
          },
        });
      }

      return novoPedido;
    });

    const gateway = obterGateway("OUTRO");
    await gateway.criarCobranca({
      valor: total,
      vencimento: new Date(),
      descricao: `Pedido #${pedido.id}`,
      referenciaExterna: String(pedido.id),
    });

    const contato = await prisma.responsavel.findFirst({
      where: { alunoId: aluno.id, ativo: true, email: { not: null } },
      select: { email: true },
    });
    const emailDestino = contato?.email ?? aluno.email;

    if (emailDestino) {
      const itensDescricao = pedido.itens
        .map((item) => `${item.quantidade}x ${item.variante.produto.nome} (${item.variante.tamanho})`)
        .join(", ");

      await obterEmailService().enviar(
        emailDestino,
        `Pedido #${pedido.id} confirmado`,
        `Seu pedido foi confirmado: ${itensDescricao}. Total: R$ ${total.toFixed(2)}. Retire na unidade.`
      );
    }

    return pedido;
  }
}
