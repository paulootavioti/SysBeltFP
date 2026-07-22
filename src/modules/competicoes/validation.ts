import { z } from "zod";

export const competicaoSchema = z.object({
  nome: z.string().min(1, "Informe o nome da competição."),
  data: z.string().min(1, "Informe a data da competição."),
  local: z.string().min(1, "Informe o local da competição."),
});

export const inscricaoSchema = z.object({
  competicaoId: z.coerce.number().int().positive("Informe a competição."),
  alunoId: z.coerce.number().int().positive("Informe o aluno."),
});

export const resultadoSchema = z.object({
  resultado: z.string().min(1, "Informe o resultado."),
});
