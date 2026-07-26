import { prisma } from "../../../shared/database/prisma";
import { AppError } from "../../../shared/errors/AppError";
import { calcularIdade } from "../../../shared/constants/faixas";
import { garantirAcessoUnidade } from "../../../shared/utils/escopoUnidade";

interface UpdateAulaAlunoDTO {
  id: number;

  presente?: boolean;

  respeito?: boolean;
  valentia?: boolean;
  esforco?: boolean;
  atencao?: boolean;
  disciplina?: boolean;

  observacao?: string | null;
}

const CAMPOS_COMPORTAMENTO = [
  "respeito",
  "valentia",
  "esforco",
  "atencao",
  "disciplina",
] as const;

export class UpdateAulaAlunoService {
  async execute(data: UpdateAulaAlunoDTO, unidadeId: number | null) {
    const registro = await prisma.aulaAluno.findUnique({
      where: {
        id: data.id,
      },
      include: {
        aula: true,
        aluno: true,
      },
    });

    if (!registro) {
      throw new AppError("Registro da aula não encontrado.");
    }

    garantirAcessoUnidade(unidadeId, registro.aula.unidadeId, "Registro da aula não encontrado.");

    if (registro.aula.status === "FINALIZADA") {
      throw new AppError(
        "Não é possível alterar uma aula finalizada."
      );
    }

    const idade = calcularIdade(registro.aluno.dataNascimento);

    const tentandoAlterarComportamento = CAMPOS_COMPORTAMENTO.some(
      (campo) => data[campo] !== undefined
    );

    if (idade > 14 && tentandoAlterarComportamento) {
      throw new AppError(
        "Avaliação comportamental disponível apenas para alunos até 14 anos."
      );
    }

    return prisma.aulaAluno.update({
      where: {
        id: data.id,
      },
      data: {
        presente: data.presente,

        respeito: data.respeito,
        valentia: data.valentia,
        esforco: data.esforco,
        atencao: data.atencao,
        disciplina: data.disciplina,

        observacao: data.observacao,
      },
    });
  }
}