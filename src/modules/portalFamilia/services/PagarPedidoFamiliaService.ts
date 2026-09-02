import { randomUUID } from "crypto";
import { prismaDaRequisicao } from "../../../shared/database/prismaDaRequisicao";
import { AppError } from "../../../shared/errors/AppError";
import { nomeDoGateway, obterGatewayConcedido } from "../../pagamentos/gateways";
import { ConfirmarPagamentoPedidoService } from "../../loja/services/ConfirmarPagamentoPedidoService";

export class PagarPedidoFamiliaService {
  async execute(pedidoId: number, alunoId: number) {
    const prisma = prismaDaRequisicao();
    const pedido = await prisma.pedido.findUnique({ where: { id: pedidoId }, include: {
      formaPagamento: true,
      aluno: { select: { nome: true, email: true, responsaveis: { where: { ativo: true }, select: { nome: true, email: true, responsavelFinanceiro: true } } } },
      itens: { include: { variante: { include: { produto: true } } } },
    } });
    if (!pedido || pedido.alunoId !== alunoId) throw new AppError("Pedido não encontrado.", 404);
    if (pedido.status !== "AGUARDANDO_PAGAMENTO") throw new AppError("Este pedido não está aguardando pagamento.");

    const ultima = await prisma.cobrancaPagamento.findFirst({ where: { pedidoId }, orderBy: { numeroTentativa: "desc" }, select: { numeroTentativa: true } });
    const gateway = await obterGatewayConcedido(pedido.formaPagamento?.tipo ?? "OUTRO", pedido.formaPagamento?.configuracao);
    const chaveIdempotencia = `pedido-${pedido.id}-${randomUUID()}`;
    const cobranca = await prisma.cobrancaPagamento.create({ data: {
      unidadeId: pedido.unidadeId, pedidoId: pedido.id, formaPagamentoId: pedido.formaPagamentoId,
      gateway: nomeDoGateway(pedido.formaPagamento?.configuracao) ?? "MANUAL", chaveIdempotencia,
      numeroTentativa: (ultima?.numeroTentativa ?? 0) + 1,
    } });
    try {
      const resultado = await gateway.criarCobranca({
        valor: pedido.total, vencimento: new Date(Date.now() + 86400000), descricao: `Pedido #${pedido.id}`,
        referenciaExterna: `pedido:${pedido.id}`, pagador: escolherPagador(pedido.aluno), chaveIdempotencia,
      });
      await prisma.cobrancaPagamento.update({ where: { id: cobranca.id }, data: {
        gatewayId: resultado.gatewayId, status: resultado.status, linkPagamento: resultado.linkPagamento,
        pixCopiaECola: resultado.pixCopiaECola, pixQrCodeBase64: resultado.pixQrCodeBase64, expiraEm: resultado.expiraEm,
      } });
      if (["PAGO", "approved", "APROVADO"].includes(resultado.status)) await new ConfirmarPagamentoPedidoService().execute(pedido.id, `gateway:${gateway.nome}`);
      return { ...pedido, pagamento: { cobrancaId: cobranca.id, gateway: gateway.nome, ...resultado } };
    } catch (erro) {
      const mensagem = erro instanceof Error ? erro.message.slice(0, 1000) : "Falha desconhecida no gateway.";
      await prisma.cobrancaPagamento.update({ where: { id: cobranca.id }, data: { status: "FALHA", erro: mensagem } });
      return { ...pedido, pagamento: { cobrancaId: cobranca.id, gateway: gateway.nome, status: "FALHA", erro: mensagem } };
    }
  }
}

function escolherPagador(aluno: { nome: string; email: string | null; responsaveis: { nome: string; email: string | null; responsavelFinanceiro: boolean }[] }) {
  const responsavel = aluno.responsaveis.find((r) => r.responsavelFinanceiro && r.email) ?? aluno.responsaveis.find((r) => r.email);
  return responsavel ? { nome: responsavel.nome, email: responsavel.email } : { nome: aluno.nome, email: aluno.email };
}
