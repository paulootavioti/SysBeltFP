import { z } from "zod";

export const ESTAGIOS_LEAD = ["NOVO", "CONTATADO", "QUALIFICADO", "EXPERIMENTAL_AGENDADA", "COMPARECEU", "NEGOCIACAO", "MATRICULADO", "PERDIDO"] as const;
export const TURNOS_LEAD = ["MANHA", "TARDE", "NOITE"] as const;

export const criarLeadPublicoSchema = z.object({
  nome: z.string().trim().min(2, "Informe o nome.").max(120),
  telefone: z.string().trim().min(10, "Informe um WhatsApp válido.").max(30),
  email: z.union([z.literal(""), z.string().email("E-mail inválido.")]).optional(),
  tipoContato: z.enum(["PRATICANTE", "RESPONSAVEL"]),
  praticanteNome: z.string().trim().max(120).optional(),
  praticanteNascimento: z.union([z.literal(""), z.iso.date()]).optional(),
  situacao: z.enum(["NUNCA_TREINOU", "TREINA_EM_OUTRA", "EX_ALUNO", "ALUNO_ATUAL"]),
  modalidadeInteresseId: z.coerce.number().int().positive(),
  turnoPreferido: z.array(z.enum(TURNOS_LEAD)).min(1).max(3),
  observacoes: z.string().trim().max(1000).optional(),
  consentimentoDados: z.literal(true, { message: "Aceite o tratamento de dados para continuar." }),
  consentimentoComunicacoes: z.boolean().default(false),
  website: z.string().max(0).optional(),
  utmSource: z.string().trim().max(100).optional(),
  utmMedium: z.string().trim().max(100).optional(),
  utmCampaign: z.string().trim().max(100).optional(),
  referrer: z.string().trim().max(500).optional(),
});

export const listarLeadsQuerySchema = z.object({
  estagio: z.enum(ESTAGIOS_LEAD).optional(),
  pagina: z.coerce.number().int().positive().default(1),
  limite: z.coerce.number().int().min(1).max(100).default(25),
});

export const canalCaptacaoSchema = z.object({
  nome: z.string().trim().min(2, "Informe o nome do canal.").max(100),
  slug: z.string().trim().min(3, "Informe o slug do canal.").max(100),
  ativo: z.boolean().default(true),
});

export const converterLeadSchema = z.object({
  dataNascimento: z.iso.date().optional(),
});

export const agendarExperimentalSchema = z.object({
  data: z.iso.datetime({ offset: true }),
});

export const atualizarEstagioLeadSchema = z.object({
  estagio: z.enum(ESTAGIOS_LEAD),
  motivoPerda: z.string().trim().min(3).max(500).optional(),
});
