import { z } from "zod";

export const inscricaoSchema = z.object({
  alunoId: z.string().min(1, "Selecione um aluno."),
});

export type InscricaoFormData = z.infer<typeof inscricaoSchema>;