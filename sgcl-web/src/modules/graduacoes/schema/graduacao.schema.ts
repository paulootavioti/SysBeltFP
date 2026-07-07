import { z } from "zod";
import { FAIXAS_INFANTIL, FAIXAS_JUVENIL_ADULTO } from "../types";

const TODAS_AS_FAIXAS = [...new Set([...FAIXAS_INFANTIL, ...FAIXAS_JUVENIL_ADULTO])];

export const graduacaoSchema = z.object({
  alunoId: z.string().min(1, "Selecione um aluno."),
  faixa: z.string().refine((f) => TODAS_AS_FAIXAS.includes(f), "Faixa inválida."),
  data: z.string().min(1, "Informe a data da graduação."),
});

export type GraduacaoFormData = z.infer<typeof graduacaoSchema>;