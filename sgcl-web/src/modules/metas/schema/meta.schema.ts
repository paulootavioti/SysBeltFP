import { z } from "zod";

const TIPOS = ["RECEITA", "NOVAS_MATRICULAS", "ALUNOS_ATIVOS", "FREQUENCIA", "INADIMPLENCIA", "RETENCAO"] as const;
const FORMATOS = ["MOEDA", "QUANTIDADE", "PERCENTUAL"] as const;

export const metaSchema = z.object({
  nome: z.string().min(1, "Informe o nome da meta."),
  tipo: z.enum(TIPOS, { message: "Selecione o tipo." }),
  valorMeta: z.string().min(1, "Informe o valor da meta."),
  formatoValor: z.enum(FORMATOS, { message: "Selecione o formato do valor." }),
  dataLimite: z.string().min(1, "Informe o prazo."),
});

export type MetaFormData = z.infer<typeof metaSchema>;
