import { z } from "zod";

export const mensalidadeSchema = z.object({
  alunoId: z.string().min(1, "Selecione um aluno."),
  valor: z.string().min(1, "Informe o valor da mensalidade."),
  vencimento: z.string().min(1, "Informe a data de vencimento."),
  dataPagamento: z.string().optional().or(z.literal("")),
  pago: z.boolean().default(false),
});

export type MensalidadeFormData = z.infer<typeof mensalidadeSchema>;
