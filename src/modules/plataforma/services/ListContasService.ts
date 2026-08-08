import { prisma } from "../../../shared/database/prisma";
import { LIMITE_PADRAO_LISTAGEM } from "../../../shared/constants/pagination";
import { calcularPrecoPorFaixa } from "../utils/precoPlataforma";

// Painel do operador do SaaS: todas as contas assinantes, com quantos
// alunos cada uma tem e quanto isso representa de receita no mês.
export class ListContasService {
  async execute() {
    const contas = await prisma.conta.findMany({
      take: LIMITE_PADRAO_LISTAGEM,
      orderBy: { nome: "asc" },
      include: {
        assinatura: { include: { plano: true } },
        _count: { select: { unidades: true } },
      },
    });

    // Uma contagem só pra todas as contas, agrupada — evita uma consulta
    // por conta quando a base de assinantes crescer.
    const alunosPorConta = await prisma.aluno.groupBy({
      by: ["unidadeId"],
      where: { ativo: true },
      _count: { _all: true },
    });

    const unidades = await prisma.unidade.findMany({ select: { id: true, contaId: true } });
    const contaDaUnidade = new Map(unidades.map((u) => [u.id, u.contaId]));

    const totalPorConta = new Map<number, number>();

    for (const grupo of alunosPorConta) {
      const contaId = contaDaUnidade.get(grupo.unidadeId);
      if (contaId === undefined) continue;

      totalPorConta.set(contaId, (totalPorConta.get(contaId) ?? 0) + grupo._count._all);
    }

    return contas.map((conta) => {
      const alunosAtivos = totalPorConta.get(conta.id) ?? 0;
      const assinatura = conta.assinatura;

      const previa = assinatura
        ? calcularPrecoPorFaixa(alunosAtivos, {
            alunosPorBloco: assinatura.plano.alunosPorBloco,
            precoPorBlocoCentavos:
              assinatura.precoPorBlocoCentavos ?? assinatura.plano.precoPorBlocoCentavos,
            blocosMinimos: assinatura.plano.blocosMinimos,
          })
        : null;

      return {
        id: conta.id,
        nome: conta.nome,
        documento: conta.documento,
        emailCobranca: conta.emailCobranca,
        ativo: conta.ativo,
        unidades: conta._count.unidades,
        alunosAtivos,
        assinatura: assinatura
          ? {
              status: assinatura.status,
              plano: assinatura.plano.nome,
              diaVencimento: assinatura.diaVencimento,
              blocos: previa?.blocos ?? 0,
              valorCentavos: previa?.valorCentavos ?? 0,
            }
          : null,
      };
    });
  }
}
