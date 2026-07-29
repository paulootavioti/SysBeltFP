import { z } from "zod";

export const TIPOS_FORMA_PAGAMENTO = [
  "PIX",
  "PIX_RECORRENTE",
  "CARTAO_CREDITO_VISTA",
  "CARTAO_CREDITO_PARCELADO",
  "CARTAO_CREDITO_RECORRENTE",
  "CARTAO_DEBITO",
  "TRANSFERENCIA",
  "DINHEIRO",
  "BOLETO",
  "LINK_PAGAMENTO",
  "OUTRO",
] as const;

export const formaPagamentoSchema = z
  .object({
    tipo: z.enum(TIPOS_FORMA_PAGAMENTO, { message: "Selecione o tipo de forma de pagamento." }),
    nomePersonalizado: z.string().trim().max(60, "Nome muito longo.").nullish(),
    configuracao: z.record(z.string(), z.unknown()).nullish(),
  })
  .refine((data) => data.tipo !== "OUTRO" || !!data.nomePersonalizado?.trim(), {
    message: "Informe o nome da forma de pagamento personalizada.",
    path: ["nomePersonalizado"],
  });
