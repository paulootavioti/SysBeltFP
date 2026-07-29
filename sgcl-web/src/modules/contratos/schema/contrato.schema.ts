import { z } from "zod";

export const contratoSchema = z.object({
  alunoId: z.string().min(1, "Selecione um aluno."),
  modeloContratoId: z.string().min(1, "Selecione um modelo de contrato."),
  planoId: z.string().optional(),
  formaPagamentoId: z.string().optional(),
  valor: z.string().min(1, "Informe o valor do contrato."),
  dataInicioVigencia: z.string().min(1, "Informe o início da vigência."),
  dataFimVigencia: z.string().optional(),
  regrasCancelamento: z.string().optional(),
  clausulas: z.string().optional(),
  renovacaoAutomatica: z.boolean(),
});

export type ContratoFormData = z.infer<typeof contratoSchema>;
