import { z } from "zod";

import { TIPO_FORMA_PAGAMENTO_LABEL } from "../types";

const TIPOS = Object.keys(TIPO_FORMA_PAGAMENTO_LABEL) as [string, ...string[]];

export const formaPagamentoSchema = z
  .object({
    tipo: z.enum(TIPOS, { message: "Selecione o tipo." }),
    nomePersonalizado: z.string().optional(),
    // "" = cobrança manual (baixa na mão), que é o padrão.
    gateway: z.string().optional(),
    // Credenciais nunca voltam da API, então o formulário abre com os
    // campos vazios mesmo quando já existem no banco. Vazio aqui significa
    // "não mexi nisso" — quem envia decide não mandar o campo.
    accessToken: z.string().optional(),
    webhookSecret: z.string().optional(),
  })
  .refine((data) => data.tipo !== "OUTRO" || !!data.nomePersonalizado?.trim(), {
    message: "Informe o nome da forma de pagamento personalizada.",
    path: ["nomePersonalizado"],
  });

export type FormaPagamentoFormData = z.infer<typeof formaPagamentoSchema>;
