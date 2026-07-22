import { z } from "zod";

export const mensalidadeSchema = z.object({
  valor: z.coerce.number().positive("Informe um valor válido."),
  vencimento: z.string().min(1, "Informe a data de vencimento."),
  alunoId: z.coerce.number().int().positive("Informe o aluno."),
});
