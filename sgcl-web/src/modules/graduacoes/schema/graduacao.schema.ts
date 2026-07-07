import { z } from "zod";
import { FAIXAS } from "../types";

export const graduacaoSchema = z.object({
  alunoId: z.string().min(1, "Selecione um aluno."),
  faixa: z.string().refine((f) => FAIXAS.includes(f), "Faixa inválida."),
  data: z.string().min(1, "Informe a data da graduação."),
});

export type GraduacaoFormData = z.infer<typeof graduacaoSchema>;
