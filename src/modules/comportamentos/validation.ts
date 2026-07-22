import { z } from "zod";

export const comportamentoSchema = z.object({
  alunoId: z.coerce.number().int().positive("Informe o aluno."),
  respeito: z.coerce.number().int(),
  valentia: z.coerce.number().int(),
  esforco: z.coerce.number().int(),
  atencao: z.coerce.number().int(),
  disciplina: z.coerce.number().int(),
  observacao: z.string().nullish(),
});
