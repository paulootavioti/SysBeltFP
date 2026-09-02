import { prismaDaRequisicao } from "../../../shared/database/prismaDaRequisicao";
import { AppError } from "../../../shared/errors/AppError";
import { nomeDoGateway, obterGatewayConcedido } from "../../pagamentos/gateways";
import { randomUUID } from "crypto";

// Qual gateway atende depende da forma de pagamento da mensalidade
// (`FormaPagamento.configuracao.gateway`). Sem gateway configurado, cai
// no manual e a recepção confirma à mão, como sempre foi.
export class PagarMensalidadeFamiliaService {
  async execute(mensalidadeId: number, alunoId: number) {
    const prisma = prismaDaRequisicao();
    const mensalidade = await prisma.mensalidade.findUnique({
      where: { id: mensalidadeId },
      include: {
        formaPagamento: true,
        // PIX exige e-mail do pagador. O do responsável vem primeiro:
        // é quem costuma pagar, e o aluno menor raramente tem e-mail.
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

    if (!mensalidade || mensalidade.alunoId !== alunoId) {
      throw new AppError("Mensalidade não encontrada.", 404);
    }

    if (mensalidade.status === "PAGA") {
      throw new AppError("Esta mensalidade já está paga.");
    }

    if (mensalidade.status === "CANCELADA" || mensalidade.status === "ESTORNADA") {
      throw new AppError("Esta mensalidade não pode ser paga.");
    }

    const gateway = await obterGatewayConcedido(
      mensalidade.formaPagamento?.tipo ?? "OUTRO",
      // A configuração inteira, não só o nome do gateway: é dela que saem
      // as credenciais da unidade. Passar só o nome cobraria na conta
      // errada quando houver mais de um assinante no mesmo servidor.
      mensalidade.formaPagamento?.configuracao
    );

    const pagador = escolherPagador(mensalidade.aluno);

    const ultimaTentativa = await prisma.cobrancaPagamento.findFirst({
      where: { mensalidadeId: mensalidade.id },
      orderBy: { numeroTentativa: "desc" },
      select: { numeroTentativa: true },
    });
    const chaveIdempotencia = `mensalidade-${mensalidade.id}-${randomUUID()}`;
    const cobranca = await prisma.cobrancaPagamento.create({
      data: {
        unidadeId: mensalidade.unidadeId,
        mensalidadeId: mensalidade.id,
        formaPagamentoId: mensalidade.formaPagamentoId,
        gateway: nomeDoGateway(mensalidade.formaPagamento?.configuracao) ?? "MANUAL",
        chaveIdempotencia,
        numeroTentativa: (ultimaTentativa?.numeroTentativa ?? 0) + 1,
      },
    });

    let resultado;

    try {
      resultado = await gateway.criarCobranca({
        valor: mensalidade.valorFinal || mensalidade.valor,
        vencimento: mensalidade.vencimento,
        descricao: mensalidade.descricao,
        referenciaExterna: String(mensalidade.id),
        pagador,
        chaveIdempotencia,
      });

      await prisma.cobrancaPagamento.update({
        where: { id: cobranca.id },
        data: {
          gatewayId: resultado.gatewayId,
          status: resultado.status,
          linkPagamento: resultado.linkPagamento,
          pixCopiaECola: resultado.pixCopiaECola,
          pixQrCodeBase64: resultado.pixQrCodeBase64,
          expiraEm: resultado.expiraEm,
          erro: null,
        },
      });
    } catch (erro) {
      await prisma.cobrancaPagamento.update({
        where: { id: cobranca.id },
        data: { status: "FALHA", erro: mensagemDoErro(erro) },
      });
      throw erro;
    }

    return {
      gateway: gateway.nome,
      cobrancaId: cobranca.id,
      ...resultado,
    };
  }
}

function mensagemDoErro(erro: unknown): string {
  return erro instanceof Error ? erro.message.slice(0, 1000) : "Falha desconhecida no gateway.";
}

// O responsável financeiro é a primeira escolha; depois qualquer
// responsável com e-mail; por último o próprio aluno.
function escolherPagador(aluno: {
  nome: string;
  email: string | null;
  responsaveis: { nome: string; email: string | null; responsavelFinanceiro: boolean }[];
}) {
  const financeiro = aluno.responsaveis.find((r) => r.responsavelFinanceiro && r.email);
  const qualquer = aluno.responsaveis.find((r) => r.email);
  const escolhido = financeiro ?? qualquer;

  if (escolhido) {
    return { email: escolhido.email, nome: escolhido.nome };
  }

  return { email: aluno.email, nome: aluno.nome };
}
