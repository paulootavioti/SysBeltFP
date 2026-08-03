import { z } from "zod";

export const criarLeadPublicoSchema = z.object({
  nome: z.string().min(1, "Informe o nome."),
  contato: z.string().min(1, "Informe o WhatsApp."),
  interesse: z.string().min(1, "Selecione a modalidade de interesse."),
});
