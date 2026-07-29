import { z } from "zod";

export const assinaturaSchema = z
  .object({
    alunoId: z.string().min(1, "Selecione um aluno."),
    planoId: z.string().optional(),
    formaPagamentoId: z.string().optional(),
    valor: z.string().min(1, "Informe o valor da mensalidade."),
    diaVencimento: z.string().min(1, "Informe o dia de vencimento."),
    dataInicio: z.string().min(1, "Informe a data de início."),
    dataFim: z.string().optional(),
    indeterminado: z.boolean(),
    numeroParcelas: z.string().optional(),
    desconto: z.string().optional(),
    acrescimo: z.string().optional(),
    multa: z.string().optional(),
    juros: z.string().optional(),
    descontoPontualidade: z.string().optional(),
  })
  .refine((data) => data.indeterminado || !!data.numeroParcelas?.trim(), {
    message: "Informe o número de parcelas ou marque como cobrança por tempo indeterminado.",
    path: ["numeroParcelas"],
  });

export type AssinaturaFormData = z.infer<typeof assinaturaSchema>;
