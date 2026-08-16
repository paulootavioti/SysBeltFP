import { prismaDaRequisicao } from "../../../shared/database/prismaDaRequisicao";
import { AppError } from "../../../shared/errors/AppError";
import { competenciaDoMes, vencimentoDaCompetencia } from "../utils/competencia";
import { calcularPrecoPorUnidade } from "../utils/precoPlataforma";
import { ContarAlunosPorUnidadeDaContaService } from "./ContarAlunosPorUnidadeDaContaService";

// A visão que o dono da academia tem da própria assinatura: qual plano,
// quantos alunos estão sendo contados agora, quanto isso dá, e o histórico
// de faturas. A prévia é calculada na hora (não lida de fatura) justamente
// pra responder "se eu matricular mais 3 alunos, muda meu preço?".
export class ObterAssinaturaDaContaService {
  async execute(contaId: number) {
    const prisma = prismaDaRequisicao();
    const assinatura = await prisma.assinaturaPlataforma.findUnique({
      where: { contaId },
      include: {
        plano: true,
        conta: { select: { id: true, nome: true, emailCobranca: true } },
      },
    });

    if (!assinatura) {
      throw new AppError("Esta conta ainda não tem assinatura da plataforma.", 404);
    }

    const alunosPorUnidade = await new ContarAlunosPorUnidadeDaContaService().execute(contaId);

    const precoPorBlocoCentavos =
      assinatura.precoPorBlocoCentavos ?? assinatura.plano.precoPorBlocoCentavos;

    const previa = calcularPrecoPorUnidade(alunosPorUnidade, {
      alunosPorBloco: assinatura.plano.alunosPorBloco,
      precoPorBlocoCentavos,
      blocosMinimos: assinatura.plano.blocosMinimos,
    });

    const competencia = competenciaDoMes();

    const faturas = await prisma.faturaPlataforma.findMany({
      where: { contaId },
      orderBy: { competencia: "desc" },
      take: 12,
    });

    return {
      conta: assinatura.conta,
      status: assinatura.status,
      diaVencimento: assinatura.diaVencimento,
      inicioEm: assinatura.inicioEm,
      fimTesteEm: assinatura.fimTesteEm,
      plano: {
        id: assinatura.plano.id,
        nome: assinatura.plano.nome,
        descricao: assinatura.plano.descricao,
        alunosPorBloco: assinatura.plano.alunosPorBloco,
        // o preço mostrado é o que VALE pra esta conta, já considerando
        // condição negociada — não o de tabela.
        precoPorBlocoCentavos,
        recursos: assinatura.plano.recursos,
      },
      previaDoMes: {
        competencia,
        vencimento: vencimentoDaCompetencia(competencia, assinatura.diaVencimento),
        unidades: previa.unidades,
        alunosContados: previa.totalLotacoes,
        alunosPorBloco: assinatura.plano.alunosPorBloco,
        blocos: previa.totalBlocos,
        precoPorBlocoCentavos,
        valorCentavos: previa.valorCentavos,
      },
      faturas,
    };
  }
}
