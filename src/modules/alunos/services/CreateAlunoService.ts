import { hash } from "bcryptjs";

import { prismaDaRequisicao } from "../../../shared/database/prismaDaRequisicao";
import { AppError } from "../../../shared/errors/AppError";
import { gerarSenhaAleatoria } from "../../../shared/utils/gerarSenhaAleatoria";
import { AuditLogService } from "../../../shared/services/AuditLogService";
import { RegistrarConsentimentoService } from "../../consentimentos/services/RegistrarConsentimentoService";
import { obterContextoRequisicao } from "../../../shared/context/contextoRequisicao";
import { validarUnidadesPermitidas } from "./validarUnidadesPermitidas";

const auditLogService = new AuditLogService();
const registrarConsentimento = new RegistrarConsentimentoService();

interface CreateAlunoDTO {
  unidadeId: number;
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
  autorizaUsoImagem?: boolean | null;

  formaPagamento?: string | null;
  diaVencimento?: string | number | null;
  planoId?: string | number | null;
  unidadesPermitidasIds?: number[];
}

function toNumberOrNull(value: unknown) {
  if (value === "" || value === null || value === undefined) {
    return null;
  }

  return Number(value);
}

export class CreateAlunoService {
  async execute(data: CreateAlunoDTO) {
    const prisma = prismaDaRequisicao();
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
    const unidadesPermitidasIds = await validarUnidadesPermitidas(
      data.unidadeId,
      data.unidadesPermitidasIds,
    );

    if (turmaId !== null) {
      const turma = await prisma.turma.findUnique({ where: { id: turmaId } });

      if (!turma || turma.unidadeId !== data.unidadeId) {
        throw new AppError("Turma não encontrada.");
      }

      if (!turma.ativo) {
        throw new AppError("Não é possível matricular o aluno em uma turma inativa.");
      }
    }

    // e-mail informado no cadastro já emite a credencial do Portal da
    // Família (login direto do aluno) — não depende de uma ação separada
    // do Admin depois.
    const senhaPortalGerada = data.email ? gerarSenhaAleatoria() : null;
    const senhaPortalHash = senhaPortalGerada ? await hash(senhaPortalGerada, 8) : null;

    const aluno = await prisma.aluno.create({
      data: {
        unidadeId: data.unidadeId,
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
        autorizaUsoImagem: data.autorizaUsoImagem ?? true,

        formaPagamento: data.formaPagamento,
        diaVencimento: toNumberOrNull(data.diaVencimento),
        planoId: toNumberOrNull(data.planoId),

        ativo: true,
        senhaPortal: senhaPortalHash,
        unidadesPermitidas: {
          create: unidadesPermitidasIds.map((unidadeId) => ({ unidadeId })),
        },
      },
      include: { unidadesPermitidas: { select: { unidadeId: true } } },
    });

    // A autorização de imagem marcada no cadastro precisa virar linha no
    // livro de registro — senão o booleano do Aluno seria uma segunda
    // fonte da verdade, divergindo do histórico de consentimentos.
    await registrarConsentimentoDeImagem(aluno, data.autorizaUsoImagem ?? true);

    await auditLogService.registrar({
      unidadeId: aluno.unidadeId,
      entidade: "Aluno",
      entidadeId: aluno.id,
      operacao: "CRIACAO",
      valoresDepois: { nome: aluno.nome, faixa: aluno.faixa, turmaId: aluno.turmaId },
    });

    const { unidadesPermitidas, ...dadosAluno } = aluno;
    return {
      ...dadosAluno,
      unidadesPermitidasIds: unidadesPermitidas.map(({ unidadeId }) => unidadeId),
      senhaPortalGerada,
    };
  }
}

// O cadastro pode ser feito por script/seed, sem usuário autenticado no
// contexto — nesse caso não há quem registrar e o consentimento fica pro
// momento em que a recepção coletar de fato.
async function registrarConsentimentoDeImagem(
  aluno: { id: number; unidadeId: number },
  concedido: boolean
) {
  const { usuarioId } = obterContextoRequisicao();

  if (!usuarioId) return;

  await registrarConsentimento.execute(
    { alunoId: aluno.id, tipo: "USO_IMAGEM", concedido },
    aluno.unidadeId,
    usuarioId
  );
}
