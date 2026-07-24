import { prisma } from "../../../shared/database/prisma";
import { AppError } from "../../../shared/errors/AppError";

interface CreateAlunoDTO {
  nome: string;
  apelido?: string | null;
  dataNascimento: string;

  sexo?: string | null;
  cpf?: string | null;
  rg?: string | null;

  telefone?: string | null;
  whatsapp?: string | null;
  email?: string | null;

  cep?: string | null;
  logradouro?: string | null;
  numero?: string | null;
  complemento?: string | null;
  bairro?: string | null;
  cidade?: string | null;
  uf?: string | null;

  escola?: string | null;
  serieEscolar?: string | null;
  turnoEscolar?: string | null;

  peso?: string | number | null;
  altura?: string | number | null;

  tamanhoKimono?: string | null;
  marcaKimono?: string | null;

  restricoesMedicas?: string | null;
  alergias?: string | null;
  medicamentos?: string | null;
  observacoes?: string | null;

  fotoUrl?: string | null;

  faixa?: string | null;
  turmaId?: string | number | null;

  formaPagamento?: string | null;
  diaVencimento?: string | number | null;
  planoId?: string | number | null;
}

function toNumberOrNull(value: unknown) {
  if (value === "" || value === null || value === undefined) {
    return null;
  }

  return Number(value);
}

export class CreateAlunoService {
  async execute(data: CreateAlunoDTO) {
    const dataNascimentoFormatada = new Date(data.dataNascimento);

    const inicioDia = new Date(
      Date.UTC(
        dataNascimentoFormatada.getUTCFullYear(),
        dataNascimentoFormatada.getUTCMonth(),
        dataNascimentoFormatada.getUTCDate()
      )
    );

    const fimDia = new Date(
      Date.UTC(
        dataNascimentoFormatada.getUTCFullYear(),
        dataNascimentoFormatada.getUTCMonth(),
        dataNascimentoFormatada.getUTCDate() + 1
      )
    );

    const alunoExistente = await prisma.aluno.findFirst({
      where: {
        nome: data.nome,
        dataNascimento: {
          gte: inicioDia,
          lt: fimDia,
        },
      },
    });

    if (alunoExistente) {
      throw new AppError(
        "Já existe um aluno cadastrado com este nome e data de nascimento."
      );
    }

    const turmaId = toNumberOrNull(data.turmaId);

    if (turmaId !== null) {
      const turma = await prisma.turma.findUnique({ where: { id: turmaId } });

      if (!turma) {
        throw new AppError("Turma não encontrada.");
      }

      if (!turma.ativo) {
        throw new AppError("Não é possível matricular o aluno em uma turma inativa.");
      }
    }

    const aluno = await prisma.aluno.create({
      data: {
        nome: data.nome,
        apelido: data.apelido,
        dataNascimento: dataNascimentoFormatada,

        sexo: data.sexo,
        cpf: data.cpf,
        rg: data.rg,

        telefone: data.telefone,
        whatsapp: data.whatsapp,
        email: data.email,

        cep: data.cep,
        logradouro: data.logradouro,
        numero: data.numero,
        complemento: data.complemento,
        bairro: data.bairro,
        cidade: data.cidade,
        uf: data.uf,

        escola: data.escola,
        serieEscolar: data.serieEscolar,
        turnoEscolar: data.turnoEscolar,

        peso: toNumberOrNull(data.peso),
        altura: toNumberOrNull(data.altura),

        tamanhoKimono: data.tamanhoKimono,
        marcaKimono: data.marcaKimono,

        restricoesMedicas: data.restricoesMedicas,
        alergias: data.alergias,
        medicamentos: data.medicamentos,
        observacoes: data.observacoes,

        fotoUrl: data.fotoUrl,

        faixa: data.faixa ?? "Branca",
        turmaId,

        formaPagamento: data.formaPagamento,
        diaVencimento: toNumberOrNull(data.diaVencimento),
        planoId: toNumberOrNull(data.planoId),

        ativo: true,
      },
    });

    return aluno;
  }
}
