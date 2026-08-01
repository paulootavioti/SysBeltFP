import { prisma } from "../../../shared/database/prisma";
import { AppError } from "../../../shared/errors/AppError";
import { obterGateway } from "../../pagamentos/gateways";

// TODO(produto/infra): nenhum gateway de pagamento está configurado ainda
// (ver src/modules/pagamentos/gateways) — este service só inicia a
// cobrança pelo gateway manual (NullPaymentGateway), que devolve status
// "aguardando confirmação manual" e nenhum link de checkout real. Quando
// um gateway de verdade for habilitado em FormaPagamento.configuracao,
// este mesmo código passa a devolver o link de pagamento de fato, sem
// mudar a rota nem o frontend.
export class PagarMensalidadeFamiliaService {
  async execute(mensalidadeId: number, alunoId: number) {
    const mensalidade = await prisma.mensalidade.findUnique({
      where: { id: mensalidadeId },
      include: { formaPagamento: true },
    });

    if (!mensalidade || mensalidade.alunoId !== alunoId) {
      throw new AppError("Mensalidade não encontrada.", 404);
    }

    if (mensalidade.status === "PAGA") {
      throw new AppError("Esta mensalidade já está paga.");
    }

    if (mensalidade.status === "CANCELADA" || mensalidade.status === "ESTORNADA") {
      throw new AppError("Esta mensalidade não pode ser paga.");
    }

    const gateway = obterGateway(
      mensalidade.formaPagamento?.tipo ?? "OUTRO",
      (mensalidade.formaPagamento?.configuracao as { gateway?: string } | null)?.gateway
    );

    const resultado = await gateway.criarCobranca({
      valor: mensalidade.valorFinal || mensalidade.valor,
      vencimento: mensalidade.vencimento,
      descricao: mensalidade.descricao,
      referenciaExterna: String(mensalidade.id),
    });

    return {
      gateway: gateway.nome,
      ...resultado,
    };
  }
}
