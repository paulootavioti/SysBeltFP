import { z } from "zod";

export const tecnicaSchema = z.object({
  nome: z.string().min(1, "Informe o nome da técnica."),
  categoria: z.string().nullish(),
  descricao: z.string().nullish(),
  faixaMinima: z.string().nullish(),
  idadeMinima: z.coerce.number().int().nullish(),
});
