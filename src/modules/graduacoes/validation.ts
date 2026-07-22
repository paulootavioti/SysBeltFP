import { z } from "zod";

const cobrancaSchema = z
  .object({
    valor: z.coerce.number().positive("Informe um valor válido para a cobrança."),
    vencimento: z.string().min(1, "Informe o vencimento da cobrança."),
  })
  .nullish();

export const graduacaoSchema = z.object({
  faixa: z.string().min(1, "Informe a faixa."),
  data: z.string().min(1, "Informe a data da graduação."),
  alunoId: z.coerce.number().int().positive("Informe o aluno."),
  cobranca: cobrancaSchema,
});

export const incrementarGrauSchema = z.object({
  alunoId: z.coerce.number().int().positive("Informe o aluno."),
  cobranca: cobrancaSchema,
});
