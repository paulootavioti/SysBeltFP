import { prismaDaRequisicao } from "../../../shared/database/prismaDaRequisicao";
import { AppError } from "../../../shared/errors/AppError";
import { garantirAcessoUnidade } from "../../../shared/utils/escopoUnidade";
import { obterGatewayConcedido } from "../../pagamentos/gateways";

export class AtivarAssinaturaGatewayService {
  async execute(id: number, unidadeId: number | null) {
    const prisma = prismaDaRequisicao();
    const assinatura = await prisma.assinatura.findUnique({
      where: { id },
      include: {
        formaPagamento: true,
        plano: { select: { nome: true } },
        aluno: {
          select: {
            nome: true,
            email: true,
            responsaveis: {
              where: { ativo: true },
              select: { nome: true, email: true, responsavelFinanceiro: true },
            },
          },
        },
      },
    });
    if (!assinatura) throw new AppError("Assinatura não encontrada.", 404);
    garantirAcessoUnidade(unidadeId, assinatura.unidadeId, "Assinatura não encontrada.");
    if (assinatura.gatewayAssinaturaId && assinatura.linkAutorizacao) return assinatura;
    if (!assinatura.formaPagamento) throw new AppError("Selecione uma forma de pagamento integrada.");

    const gateway = await obterGatewayConcedido(
      assinatura.formaPagamento.tipo,
      assinatura.formaPagamento.configuracao
    );
    const financeiro = assinatura.aluno.responsaveis.find((item) => item.responsavelFinanceiro && item.email);
    const responsavel = financeiro ?? assinatura.aluno.responsaveis.find((item) => item.email);
    const pagador = responsavel ?? assinatura.aluno;
    const resultado = await gateway.criarAssinatura({
      valor: assinatura.valor,
      diaVencimento: assinatura.diaVencimento,
      referenciaExterna: String(assinatura.id),
      pagador: { nome: pagador.nome, email: pagador.email },
      descricao: assinatura.plano?.nome ?? "Mensalidade recorrente",
      dataFim: assinatura.dataFim,
      urlRetorno: process.env.PORTAL_FAMILIA_URL,
    });

    return prisma.assinatura.update({
      where: { id },
      data: {
        gatewayAssinaturaId: resultado.gatewayAssinaturaId,
        gatewayStatus: resultado.status,
        linkAutorizacao: resultado.linkAutorizacao,
        gatewayAtualizadoEm: new Date(),
      },
    });
  }
}
