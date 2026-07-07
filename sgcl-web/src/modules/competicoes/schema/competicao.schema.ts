import { z } from "zod";

export const competicaoSchema = z.object({
  nome: z.string().min(3, "Informe o nome da competição."),
  data: z.string().min(1, "Informe a data."),
  local: z.string().min(2, "Informe o local."),
});

export type CompeticaoFormData = z.infer<typeof competicaoSchema>;