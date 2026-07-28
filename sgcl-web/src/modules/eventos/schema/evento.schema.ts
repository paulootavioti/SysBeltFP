import { z } from "zod";

const TIPOS = [
  "CAMPANHA_MATRICULA",
  "CAMPANHA_PROMOCIONAL",
  "CAMPANHA_INDICACAO",
  "SEMINARIO",
  "WORKSHOP",
  "AULAO",
  "COMPETICAO",
  "OUTRO",
] as const;

const STATUS = ["RASCUNHO", "AGENDADO", "EM_ANDAMENTO", "CONCLUIDO", "CANCELADO"] as const;

export const eventoSchema = z.object({
  titulo: z.string().min(3, "Informe o título."),
  descricao: z.string().optional(),
  tipo: z.enum(TIPOS, { message: "Selecione o tipo." }),
  status: z.enum(STATUS, { message: "Selecione o status." }),
  dataInicio: z.string().min(1, "Informe a data de início."),
  dataFim: z.string().optional(),
  local: z.string().optional(),
  unidadeId: z.string().optional(),
  metaParticipantes: z.string().optional(),
  participantesConfirmados: z.string().optional(),
  investimento: z.string().optional(),
  receitaGerada: z.string().optional(),
  responsavel: z.string().optional(),
});

export type EventoFormData = z.infer<typeof eventoSchema>;
