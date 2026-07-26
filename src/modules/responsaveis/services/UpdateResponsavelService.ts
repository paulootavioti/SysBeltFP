import { prisma } from "../../../shared/database/prisma";
import { AppError } from "../../../shared/errors/AppError";
import { garantirAcessoUnidade } from "../../../shared/utils/escopoUnidade";

interface UpdateResponsavelDTO {
  id: number;

  nome: string;
  apelido?: string | null;

  cpf?: string | null;
  rg?: string | null;

  dataNascimento?: string | null;
  sexo?: string | null;

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

  parentesco: string;

  responsavelFinanceiro?: boolean;
  podeBuscar?: boolean;
  contatoEmergencia?: boolean;
  recebeComunicados?: boolean;

  observacoes?: string | null;
  fotoUrl?: string | null;

  alunoId: number;
}

export class UpdateResponsavelService {
  async execute(data: UpdateResponsavelDTO, unidadeId: number | null) {
    const responsavel = await prisma.responsavel.findUnique({
      where: { id: data.id },
    });

    if (!responsavel) {
      throw new AppError("Responsável não encontrado.");
    }

    garantirAcessoUnidade(unidadeId, responsavel.unidadeId, "Responsável não encontrado.");

    const aluno = await prisma.aluno.findUnique({
      where: { id: data.alunoId },
    });

    if (!aluno || aluno.unidadeId !== responsavel.unidadeId) {
      throw new AppError("Aluno não encontrado.");
    }

    if (data.cpf) {
      const cpfExistente = await prisma.responsavel.findFirst({
        where: {
          cpf: data.cpf,
          unidadeId: responsavel.unidadeId,
          NOT: {
            id: data.id,
          },
        },
      });

      if (cpfExistente) {
        throw new AppError(
          "Já existe outro responsável cadastrado com este CPF."
        );
      }
    }

    return prisma.responsavel.update({
      where: { id: data.id },
      data: {
        nome: data.nome,
        apelido: data.apelido,

        cpf: data.cpf,
        rg: data.rg,

        dataNascimento: data.dataNascimento
          ? new Date(data.dataNascimento)
          : null,

        sexo: data.sexo,

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

        parentesco: data.parentesco,

        responsavelFinanceiro:
          data.responsavelFinanceiro ?? false,

        podeBuscar:
          data.podeBuscar ?? true,

        contatoEmergencia:
          data.contatoEmergencia ?? false,

        recebeComunicados:
          data.recebeComunicados ?? true,

        observacoes: data.observacoes,
        fotoUrl: data.fotoUrl,

        alunoId: data.alunoId,
      },
    });
  }
} 