import { z } from "zod";

import { TIPO_FORMA_PAGAMENTO_LABEL } from "../types";

const TIPOS = Object.keys(TIPO_FORMA_PAGAMENTO_LABEL) as [string, ...string[]];

export const formaPagamentoSchema = z
  .object({
    tipo: z.enum(TIPOS, { message: "Selecione o tipo." }),
    nomePersonalizado: z.string().optional(),
  })
  .refine((data) => data.tipo !== "OUTRO" || !!data.nomePersonalizado?.trim(), {
    message: "Informe o nome da forma de pagamento personalizada.",
    path: ["nomePersonalizado"],
  });

export type FormaPagamentoFormData = z.infer<typeof formaPagamentoSchema>;
