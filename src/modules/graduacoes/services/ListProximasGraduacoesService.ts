import { prismaDaRequisicao } from "../../../shared/database/prismaDaRequisicao";
import { escopoUnidade } from "../../../shared/utils/escopoUnidade";
import { calcularIdade, getFaixasDaTrilha, getTrilhaFaixa } from "../../../shared/constants/faixas";

const AULAS_POR_GRAU = 8;
const GRAUS_POR_FAIXA = 4;
const AULAS_POR_FAIXA = AULAS_POR_GRAU * GRAUS_POR_FAIXA;

export interface AlunoProximaGraduacao {
  alunoId: number;
  nome: string;
  faixa: string;
  proximaFaixa: string | null;
  presencas: number;
  aulasRealizadas: number;
  aulasRestantes: number;
  percentualProgresso: number;
  grauAtual: number;
  faltamParaProximoGrau: number;
  aptoGraduacao: boolean;
}

// Mesma regra de elegibilidade de sempre (apto quando as presenças batem
// exatamente num múltiplo de `AULAS_POR_GRAU`) — só enriquecida com o
// progresso dentro do ciclo de faixa (32 aulas = 4 graus), pra alimentar o
// card "Próximas Graduações" do dashboard e a tela de acompanhamento.
//
// `apenasElegiveis` (default true, mesmo comportamento de sempre) filtra só
// quem já pode graduar — usado pelo contador de badge do menu. A tela
// "Próximas Graduações" passa `false` pra mostrar o progresso de todo mundo,
// não só de quem já está apto.
export class ListProximasGraduacoesService {
  async execute(
    unidadeId: number | null,
    apenasElegiveis = true
  ): Promise<AlunoProximaGraduacao[]> {
    const prisma = prismaDaRequisicao();
    const alunos = await prisma.aluno.findMany({
      where: { ativo: true, ...escopoUnidade(unidadeId) },
    });

    const presencasPorAluno = await prisma.aulaAluno.groupBy({
      by: ["alunoId"],
      where: {
        presente: true,
        alunoId: { in: alunos.map((aluno) => aluno.id) },
      },
      _count: { _all: true },
    });

    const totalPorAluno = new Map(presencasPorAluno.map((item) => [item.alunoId, item._count._all]));

    return alunos
      .map((aluno): AlunoProximaGraduacao => {
        const totalPresencas = totalPorAluno.get(aluno.id) ?? 0;
        const aptoGraduacao = totalPresencas > 0 && totalPresencas % AULAS_POR_GRAU === 0;

        const aulasNaFaixaAtual = totalPresencas % AULAS_POR_FAIXA;
        const aulasRestantes = aulasNaFaixaAtual === 0 ? 0 : AULAS_POR_FAIXA - aulasNaFaixaAtual;
        const percentualProgresso = (aulasNaFaixaAtual / AULAS_POR_FAIXA) * 100;

        const grauAtual = Math.floor(aulasNaFaixaAtual / AULAS_POR_GRAU);
        const restoNoGrau = totalPresencas % AULAS_POR_GRAU;
        const faltamParaProximoGrau = restoNoGrau === 0 ? 0 : AULAS_POR_GRAU - restoNoGrau;

        const trilha = getTrilhaFaixa(calcularIdade(aluno.dataNascimento));
        const faixasDaTrilha = getFaixasDaTrilha(trilha);
        const indiceFaixaAtual = faixasDaTrilha.indexOf(aluno.faixa);
        const proximaFaixa =
          indiceFaixaAtual >= 0 && indiceFaixaAtual < faixasDaTrilha.length - 1
            ? faixasDaTrilha[indiceFaixaAtual + 1]
            : null;

        return {
          alunoId: aluno.id,
          nome: aluno.nome,
          faixa: aluno.faixa,
          proximaFaixa,
          presencas: totalPresencas,
          aulasRealizadas: aulasNaFaixaAtual,
          aulasRestantes,
          percentualProgresso,
          grauAtual,
          faltamParaProximoGrau,
          aptoGraduacao,
        };
      })
      .filter((aluno) => !apenasElegiveis || aluno.aptoGraduacao);
  }
}
