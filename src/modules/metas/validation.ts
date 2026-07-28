import { z } from "zod";
import { TIPOS_META, FORMATOS_VALOR } from "./constants";

export const metaSchema = z.object({
  nome: z.string().min(1, "Informe o nome da meta."),
  tipo: z.enum(TIPOS_META, { message: "Selecione um tipo de meta válido." }),
  valorMeta: z.union([z.string(), z.number()]).refine((v) => Number(v) > 0, "Informe um valor de meta maior que zero."),
  formatoValor: z.enum(FORMATOS_VALOR, { message: "Selecione um formato de valor válido." }),
  dataLimite: z.string().min(1, "Informe o prazo da meta."),
});
