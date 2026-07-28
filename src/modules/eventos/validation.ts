import { z } from "zod";
import { TIPOS_EVENTO, STATUS_EVENTO } from "./constants";

export const eventoSchema = z.object({
  titulo: z.string().min(3, "Informe o título."),
  descricao: z.string().nullish(),
  tipo: z.enum(TIPOS_EVENTO, { message: "Selecione o tipo." }),
  status: z.enum(STATUS_EVENTO, { message: "Selecione o status." }),
  dataInicio: z.string().min(1, "Informe a data de início."),
  dataFim: z.string().nullish(),
  local: z.string().nullish(),
  metaParticipantes: z.union([z.string(), z.number()]).nullish(),
  participantesConfirmados: z.union([z.string(), z.number()]).nullish(),
  investimento: z.union([z.string(), z.number()]).nullish(),
  receitaGerada: z.union([z.string(), z.number()]).nullish(),
  responsavel: z.string().nullish(),
});
