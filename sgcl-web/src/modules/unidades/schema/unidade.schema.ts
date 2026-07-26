import { z } from "zod";

export const unidadeSchema = z.object({
  nome: z.string().min(2, "Informe o nome da unidade."),
});

export type UnidadeFormData = z.infer<typeof unidadeSchema>;
