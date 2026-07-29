import { z } from "zod";

export const assinaturaSchema = z
  .object({
    alunoId: z.coerce.number().int().positive("Informe o aluno."),
    planoId: z.coerce.number().int().positive().nullish(),
    formaPagamentoId: z.coerce.number().int().positive().nullish(),
    valor: z.coerce.number().positive("Informe um valor válido."),
    diaVencimento: z.coerce.number().int().min(1, "Dia inválido.").max(31, "Dia inválido."),
    dataInicio: z.string().min(1, "Informe a data de início."),
    dataFim: z.string().nullish(),
    indeterminado: z.boolean(),
    numeroParcelas: z.coerce.number().int().positive().nullish(),
    desconto: z.coerce.number().min(0, "O desconto não pode ser negativo.").nullish(),
    acrescimo: z.coerce.number().min(0, "O acréscimo não pode ser negativo.").nullish(),
    multa: z.coerce.number().min(0, "A multa não pode ser negativa.").nullish(),
    juros: z.coerce.number().min(0, "Os juros não podem ser negativos.").nullish(),
    descontoPontualidade: z.coerce.number().min(0, "O desconto por pontualidade não pode ser negativo.").nullish(),
  })
  .refine((data) => data.indeterminado || !!data.numeroParcelas, {
    message: "Informe o número de parcelas ou marque como cobrança por tempo indeterminado.",
    path: ["numeroParcelas"],
  });

export const alterarStatusAssinaturaSchema = z.object({
  status: z.enum(["ATIVA", "PAUSADA", "CANCELADA"], { message: "Status inválido." }),
});
