import { prisma } from "../../../shared/database/prisma";
import { AppError } from "../../../shared/errors/AppError";
import { garantirAcessoUnidade } from "../../../shared/utils/escopoUnidade";
import { determinarContratante } from "./determinarContratante";
import { substituirVariaveisContrato, montarEndereco } from "./variaveisContrato";

interface GerarConteudoContratoDTO {
  unidadeId: number;
  alunoId: number;
  modeloContratoId: number;
  planoId?: number | null;
  formaPagamentoId?: number | null;
  valor: number;
  dataFimVigencia?: string | null;
}

// Lookups + substituição de variáveis compartilhados entre criação e
// edição de contrato — mantém as duas operações consistentes (mesmo
// snapshot de conteúdo pra mesmos dados de entrada).
export async function gerarConteudoContrato(data: GerarConteudoContratoDTO) {
  const aluno = await prisma.aluno.findUnique({
    where: { id: data.alunoId },
    include: {
      responsaveis: true,
      turma: { include: { professor: true } },
    },
  });

  if (!aluno) {
    throw new AppError("Aluno não encontrado.");
  }

  garantirAcessoUnidade(data.unidadeId, aluno.unidadeId, "Aluno não encontrado.");

  const modeloContrato = await prisma.modeloContrato.findUnique({ where: { id: data.modeloContratoId } });

  if (!modeloContrato) {
    throw new AppError("Modelo de contrato não encontrado.");
  }

  garantirAcessoUnidade(data.unidadeId, modeloContrato.unidadeId, "Modelo de contrato não encontrado.");

  if (!modeloContrato.ativo) {
    throw new AppError("Este modelo de contrato está inativo.");
  }

  const unidade = await prisma.unidade.findUnique({ where: { id: data.unidadeId } });

  if (!unidade) {
    throw new AppError("Unidade não encontrada.");
  }

  let plano = null;
  if (data.planoId) {
    plano = await prisma.plano.findUnique({ where: { id: data.planoId } });

    if (!plano) {
      throw new AppError("Plano não encontrado.");
    }

    garantirAcessoUnidade(data.unidadeId, plano.unidadeId, "Plano não encontrado.");
  }

  if (data.formaPagamentoId) {
    const formaPagamento = await prisma.formaPagamento.findUnique({ where: { id: data.formaPagamentoId } });

    if (!formaPagamento) {
      throw new AppError("Forma de pagamento não encontrada.");
    }

    garantirAcessoUnidade(data.unidadeId, formaPagamento.unidadeId, "Forma de pagamento não encontrada.");
  }

  const { contratanteResponsavelId, ehMenorDeIdade } = determinarContratante(
    aluno.dataNascimento,
    aluno.responsaveis
  );

  const responsavel = contratanteResponsavelId
    ? aluno.responsaveis.find((r) => r.id === contratanteResponsavelId)
    : null;

  const conteudoGerado = substituirVariaveisContrato(modeloContrato.conteudo, {
    nomeAluno: aluno.nome,
    nomeResponsavel: responsavel?.nome ?? null,
    nomeContratante: ehMenorDeIdade ? responsavel!.nome : aluno.nome,
    cpf: ehMenorDeIdade ? responsavel?.cpf : aluno.cpf,
    endereco: ehMenorDeIdade ? montarEndereco(responsavel!) : montarEndereco(aluno),
    unidade: unidade.nome,
    professor: aluno.turma?.professor?.nome ?? null,
    plano: plano?.nome ?? null,
    valor: data.valor,
    vencimento: data.dataFimVigencia ? new Date(data.dataFimVigencia) : null,
    data: new Date(),
  });

  return { conteudoGerado, contratanteResponsavelId, aluno };
}
