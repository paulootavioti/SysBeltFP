import { z } from "zod";

import { RECURSOS_PLATAFORMA } from "./utils/recursosDoPlano";

// Dinheiro entra em CENTAVOS inteiros.
//
// `int()` sozinho NÃO protege contra confundir reais com centavos: em JSON,
// 37.0 vira o inteiro 37, então um plano digitado como "37" (querendo dizer
// R$ 37,00) passaria calado e faturaria R$ 0,37 — a diferença só apareceria
// na conta do cliente. O piso abaixo é o que barra isso: nenhum plano de
// verdade cobra menos de R$ 1,00 por faixa, então qualquer valor de 1 a 99
// é erro de unidade, não preço.
const PISO_CENTAVOS = 100;

const centavos = z
  .number()
  .int("Informe o valor em centavos, sem casas decimais (R$ 37,00 = 3700).")
  .min(
    PISO_CENTAVOS,
    "Valor em centavos: R$ 37,00 se escreve 3700, não 37. O mínimo é 100 (R$ 1,00)."
  );

export const planoPlataformaSchema = z.object({
  nome: z.string().trim().min(2, "Informe o nome do plano.").max(60, "Nome muito longo."),
  descricao: z.string().trim().max(300, "Descrição muito longa.").nullish(),
  alunosPorBloco: z
    .number()
    .int("A faixa precisa ser um número inteiro de alunos.")
    .positive("A faixa precisa ter pelo menos 1 aluno."),
  precoPorBlocoCentavos: centavos,
  blocosMinimos: z.number().int().min(0).max(100).optional(),
  recursos: z.array(z.enum(RECURSOS_PLATAFORMA)).optional(),
});

export const criarContaSchema = z.object({
  nome: z.string().trim().min(2, "Informe o nome do assinante.").max(120, "Nome muito longo."),
  documento: z.string().trim().max(20, "Documento muito longo.").nullish(),
  emailCobranca: z.string().trim().email("E-mail de cobrança inválido.").nullish(),
  nomePrimeiraUnidade: z.string().trim().max(120, "Nome muito longo.").nullish(),
  planoId: z.number().int().positive("Selecione o plano."),
  diaVencimento: z.number().int().min(1).max(31).optional(),
  precoPorBlocoCentavos: centavos.nullish(),
  diasDeTeste: z.number().int().min(0).max(365).optional(),
});

export const alterarAssinaturaSchema = z
  .object({
    planoId: z.number().int().positive().optional(),
    status: z.enum(["TESTE", "ATIVA", "INADIMPLENTE", "SUSPENSA", "CANCELADA"]).optional(),
    precoPorBlocoCentavos: centavos.nullish(),
    diaVencimento: z.number().int().min(1).max(31).optional(),
  })
  .refine((data) => Object.values(data).some((valor) => valor !== undefined), {
    message: "Informe ao menos um campo para alterar.",
  });
