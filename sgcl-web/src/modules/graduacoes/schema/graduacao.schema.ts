import { z } from "zod";
import { FAIXAS_INFANTIL, FAIXAS_JUVENIL_ADULTO } from "../types";

const TODAS_AS_FAIXAS = [...new Set([...FAIXAS_INFANTIL, ...FAIXAS_JUVENIL_ADULTO])];

export const graduacaoSchema = z
  .object({
    alunoId: z.string().min(1, "Selecione um aluno."),
    tipo: z.enum(["FAIXA", "GRAU"]),
    faixa: z.string().optional(),
    data: z.string().min(1, "Informe a data da graduação."),
    gerarCobranca: z.boolean().optional(),
    valorCobranca: z.string().optional(),
    vencimentoCobranca: z.string().optional(),
  })
  .refine((data) => data.tipo !== "FAIXA" || TODAS_AS_FAIXAS.includes(data.faixa ?? ""), {
    message: "Faixa inválida.",
    path: ["faixa"],
  })
  .refine((data) => !data.gerarCobranca || !!data.valorCobranca, {
    message: "Informe o valor da cobrança.",
    path: ["valorCobranca"],
  })
  .refine((data) => !data.gerarCobranca || !!data.vencimentoCobranca, {
    message: "Informe a data de vencimento da cobrança.",
    path: ["vencimentoCobranca"],
  });

export type GraduacaoFormData = z.infer<typeof graduacaoSchema>;