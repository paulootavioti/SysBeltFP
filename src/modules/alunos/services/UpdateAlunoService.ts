import { hash } from "bcryptjs";

import { prisma } from "../../../shared/database/prisma";
import { AppError } from "../../../shared/errors/AppError";
import { garantirAcessoUnidade } from "../../../shared/utils/escopoUnidade";
import { gerarSenhaAleatoria } from "../../../shared/utils/gerarSenhaAleatoria";

interface UpdateAlunoDTO {
  id: number;

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

export class UpdateAlunoService {
  async execute(data: UpdateAlunoDTO, unidadeId: number | null) {
    const aluno = await prisma.aluno.findUnique({
      where: { id: data.id },
      omit: { senhaPortal: false },
    });

    if (!aluno) {
      throw new AppError("Aluno não encontrado.");
    }

    garantirAcessoUnidade(unidadeId, aluno.unidadeId, "Aluno não encontrado.");

    const turmaId = toNumberOrNull(data.turmaId);

    if (turmaId !== null && turmaId !== aluno.turmaId) {
      const turma = await prisma.turma.findUnique({ where: { id: turmaId } });

      if (!turma || turma.unidadeId !== aluno.unidadeId) {
        throw new AppError("Turma não encontrada.");
      }

      if (!turma.ativo) {
        throw new AppError("Não é possível matricular o aluno em uma turma inativa.");
      }
    }

    // mesma lógica do UpdateResponsavelService: se o aluno ganhou e-mail
    // agora e ainda não tinha credencial do portal, já emite a senha.
    const precisaGerarSenha = Boolean(data.email) && !aluno.senhaPortal;
    const senhaPortalGerada = precisaGerarSenha ? gerarSenhaAleatoria() : null;
    const senhaPortalHash = senhaPortalGerada ? await hash(senhaPortalGerada, 8) : undefined;

    const atualizado = await prisma.aluno.update({
      where: { id: data.id },
      data: {
        nome: data.nome,
        apelido: data.apelido,
        dataNascimento: new Date(data.dataNascimento),

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
        turmaId: toNumberOrNull(data.turmaId),

        formaPagamento: data.formaPagamento,
        diaVencimento: toNumberOrNull(data.diaVencimento),
        planoId: toNumberOrNull(data.planoId),
        ...(senhaPortalHash !== undefined ? { senhaPortal: senhaPortalHash } : {}),
      },
    });

    return { ...atualizado, senhaPortalGerada };
  }
}