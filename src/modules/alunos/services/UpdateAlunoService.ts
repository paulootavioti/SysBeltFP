import { hash } from "bcryptjs";

import { prisma } from "../../../shared/database/prisma";
import { AppError } from "../../../shared/errors/AppError";
import { garantirAcessoUnidade } from "../../../shared/utils/escopoUnidade";
import { gerarSenhaAleatoria } from "../../../shared/utils/gerarSenhaAleatoria";
import { AuditLogService } from "../../../shared/services/AuditLogService";
import { RegistrarConsentimentoService } from "../../consentimentos/services/RegistrarConsentimentoService";
import { obterContextoRequisicao } from "../../../shared/context/contextoRequisicao";
import { validarUnidadesPermitidas } from "./validarUnidadesPermitidas";

const auditLogService = new AuditLogService();
const registrarConsentimento = new RegistrarConsentimentoService();

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

// Guardar o cadastro inteiro em cada edição encheria a auditoria de
// ruído. Este recorte é o que de fato importa rastrear: identificação,
// dado sensível de saúde e a autorização de imagem.
function recorteAuditavel(aluno: {
  nome: string;
  cpf: string | null;
  faixa: string;
  turmaId: number | null;
  ativo: boolean;
  restricoesMedicas: string | null;
  alergias: string | null;
  medicamentos: string | null;
  autorizaUsoImagem: boolean;
}) {
  return {
    nome: aluno.nome,
    cpf: aluno.cpf,
    faixa: aluno.faixa,
    turmaId: aluno.turmaId,
    ativo: aluno.ativo,
    restricoesMedicas: aluno.restricoesMedicas,
    alergias: aluno.alergias,
    medicamentos: aluno.medicamentos,
    autorizaUsoImagem: aluno.autorizaUsoImagem,
  };
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
    const unidadesPermitidasIds = data.unidadesPermitidasIds === undefined
      ? undefined
      : await validarUnidadesPermitidas(aluno.unidadeId, data.unidadesPermitidasIds);

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
        ...(data.autorizaUsoImagem !== null && data.autorizaUsoImagem !== undefined
          ? { autorizaUsoImagem: data.autorizaUsoImagem }
          : {}),

        formaPagamento: data.formaPagamento,
        diaVencimento: toNumberOrNull(data.diaVencimento),
        planoId: toNumberOrNull(data.planoId),
        ...(senhaPortalHash !== undefined ? { senhaPortal: senhaPortalHash } : {}),
        ...(unidadesPermitidasIds && {
          unidadesPermitidas: {
            deleteMany: {},
            create: unidadesPermitidasIds.map((unidadeId) => ({ unidadeId })),
          },
        }),
      },
      include: { unidadesPermitidas: { select: { unidadeId: true } } },
    });

    const mudouAutorizacao =
      data.autorizaUsoImagem !== null &&
      data.autorizaUsoImagem !== undefined &&
      data.autorizaUsoImagem !== aluno.autorizaUsoImagem;

    // Só registra quando a resposta de fato muda: reabrir e salvar o
    // cadastro sem tocar na caixa não deve virar consentimento novo.
    if (mudouAutorizacao) {
      const { usuarioId } = obterContextoRequisicao();

      if (usuarioId) {
        await registrarConsentimento.execute(
          { alunoId: atualizado.id, tipo: "USO_IMAGEM", concedido: data.autorizaUsoImagem! },
          atualizado.unidadeId,
          usuarioId
        );
      }
    }

    await auditLogService.registrar({
      unidadeId: atualizado.unidadeId,
      entidade: "Aluno",
      entidadeId: atualizado.id,
      operacao: "ATUALIZACAO",
      // dados de saúde e documento são o que mais importa saber quem
      // mexeu — o diff completo do cadastro seria ruído.
      valoresAntes: recorteAuditavel(aluno),
      valoresDepois: recorteAuditavel(atualizado),
    });

    const { unidadesPermitidas, ...dadosAluno } = atualizado;
    return {
      ...dadosAluno,
      unidadesPermitidasIds: unidadesPermitidas.map(({ unidadeId }) => unidadeId),
      senhaPortalGerada,
    };
  }
}
