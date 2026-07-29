import { z } from "zod";

export const mensalidadeSchema = z.object({
  valor: z.coerce.number().positive("Informe um valor válido."),
  vencimento: z.string().min(1, "Informe a data de vencimento."),
  alunoId: z.coerce.number().int().positive("Informe o aluno."),
  descricao: z.string().trim().max(200, "Descrição muito longa.").nullish(),
  formaPagamentoId: z.coerce.number().int().positive().nullish(),
  desconto: z.coerce.number().min(0, "O desconto não pode ser negativo.").nullish(),
  acrescimo: z.coerce.number().min(0, "O acréscimo não pode ser negativo.").nullish(),
  multa: z.coerce.number().min(0, "A multa não pode ser negativa.").nullish(),
  juros: z.coerce.number().min(0, "Os juros não podem ser negativos.").nullish(),
});

export const cancelarMensalidadeSchema = z.object({
  motivo: z.string().trim().min(1, "Informe o motivo do cancelamento."),
});

export const estornarMensalidadeSchema = z.object({
  motivo: z.string().trim().min(1, "Informe o motivo do estorno."),
});

export const pagarMensalidadeSchema = z.object({
  formaPagamentoId: z.coerce.number().int().positive().nullish(),
});

export const registrarComprovanteSchema = z.object({
  comprovanteUrl: z.string().trim().min(1, "Informe a URL do comprovante."),
});
