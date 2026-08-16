import { prismaDaRequisicao } from "../../../shared/database/prismaDaRequisicao";
import { AppError } from "../../../shared/errors/AppError";
import { garantirAcessoUnidade } from "../../../shared/utils/escopoUnidade";

export class GetEvolucaoAlunoService {
  async execute(alunoId: number, unidadeId: number | null) {
    const prisma = prismaDaRequisicao();
    const aluno = await prisma.aluno.findUnique({
      where: {
        id: alunoId
      }
    });

    if (!aluno) {
      throw new AppError("Aluno não encontrado.");
    }

    garantirAcessoUnidade(unidadeId, aluno.unidadeId, "Aluno não encontrado.");

    const presencas = await prisma.aulaAluno.count({
      where: {
        alunoId,
        presente: true,
      },
    });

    const aulasPorGrau = 8;
    const grausPorFaixa = 4;
    const aulasPorFaixa = aulasPorGrau * grausPorFaixa;

    const grauCalculado =
      Math.floor(presencas / aulasPorGrau) % grausPorFaixa;

    const aulasNaFaixaAtual =
      presencas % aulasPorFaixa;

    const faltamParaProximoGrau =
      aulasPorGrau - (presencas % aulasPorGrau);

    const faltamParaProximaFaixa =
      aulasPorFaixa - aulasNaFaixaAtual;

    return {
      alunoId: aluno.id,
      nome: aluno.nome,
      faixaAtual: aluno.faixa,
      grauAtual: aluno.grau,
      grauCalculado,
      presencas,
      faltamParaProximoGrau:
        faltamParaProximoGrau === 8 ? 0 : faltamParaProximoGrau,
      faltamParaProximaFaixa:
        faltamParaProximaFaixa === 32 ? 0 : faltamParaProximaFaixa
    };
  }
}
