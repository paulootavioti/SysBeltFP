import { z } from "zod";

export const mensalidadeSchema = z.object({
  alunoId: z.string().min(1, "Selecione um aluno."),
  valor: z.string().min(1, "Informe o valor da mensalidade."),
  vencimento: z.string().min(1, "Informe a data de vencimento."),
  dataPagamento: z.string().optional().or(z.literal("")),
  pago: z.boolean(),
  descricao: z.string().optional(),
  formaPagamentoId: z.string().optional(),
  desconto: z.string().optional(),
  acrescimo: z.string().optional(),
  multa: z.string().optional(),
  juros: z.string().optional(),
});

export type MensalidadeFormData = z.infer<typeof mensalidadeSchema>;

export const cancelarEstornarSchema = z.object({
  motivo: z.string().trim().min(1, "Informe o motivo."),
});

export type CancelarEstornarFormData = z.infer<typeof cancelarEstornarSchema>;
