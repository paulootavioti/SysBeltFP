import { prismaDaRequisicao } from "../../../shared/database/prismaDaRequisicao";
import { AppError } from "../../../shared/errors/AppError";
import { garantirAcessoUnidade } from "../../../shared/utils/escopoUnidade";

export class RelatorioEvolucaoService {

  async execute(alunoId: number, unidadeId: number | null) {
    const prisma = prismaDaRequisicao();

    const aluno =
      await prisma.aluno.findUnique({
        where: {
          id: alunoId
        }
      });

    if (!aluno) {
      throw new AppError(
        "Aluno não encontrado."
      );
    }

    garantirAcessoUnidade(unidadeId, aluno.unidadeId, "Aluno não encontrado.");

    const presencas =
      await prisma.aulaAluno.count({
        where: {
          alunoId,
          presente: true,
        }
      });

    const faltamParaProximoGrau =
      8 - (presencas % 8);

    return {
      aluno: aluno.nome,
      faixa: aluno.faixa,
      grau: aluno.grau,
      presencas,

      mensagem: `
📋 RELATÓRIO DE EVOLUÇÃO

🥋 Aluno: ${aluno.nome}

🏅 Faixa Atual: ${aluno.faixa}
⭐ Grau Atual: ${aluno.grau}

📆 Presenças Registradas: ${presencas}

🎯 Faltam ${
        faltamParaProximoGrau === 8
          ? 0
          : faltamParaProximoGrau
      } aulas para o próximo grau.

Parabéns pelo comprometimento!

Equipe Cia de Lutas Weberty Viana
      `.trim()
    };

  }

}
