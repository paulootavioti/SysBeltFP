import { prismaDaRequisicao } from "../../../shared/database/prismaDaRequisicao";
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

interface Solicitante {
  id: number;
  perfil: string;
  unidadeId: number | null;
}

const CAMPOS_COMPORTAMENTO = [
  "respeito",
  "valentia",
  "esforco",
  "atencao",
  "disciplina",
] as const;

export class UpdateAulaAlunoService {
  async execute(data: UpdateAulaAlunoDTO, solicitante: Solicitante) {
    const prisma = prismaDaRequisicao();
    const registro = await prisma.aulaAluno.findUnique({
      where: {
        id: data.id,
      },
      include: {
        aula: { include: { turma: true } },
        aluno: true,
      },
    });

    if (!registro) {
      throw new AppError("Registro da aula não encontrado.");
    }

    garantirAcessoUnidade(solicitante.unidadeId, registro.aula.unidadeId, "Registro da aula não encontrado.");

    if (solicitante.perfil === "PROFESSOR" && registro.aula.turma?.professorId !== solicitante.id) {
      throw new AppError("Você só pode alterar a chamada das suas próprias turmas.", 403);
    }

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
