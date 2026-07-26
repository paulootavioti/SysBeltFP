import { z } from "zod";

export const unidadeSchema = z.object({
  nome: z.string().min(1, "Informe o nome da unidade."),
});
