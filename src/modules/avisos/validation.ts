import { z } from "zod";

export const reconhecerAvisosSchema = z.object({
  avisos: z
    .array(
      z.object({
        tipo: z.string().min(1),
        referenciaId: z.coerce.number().int().positive(),
      })
    )
    .min(1, "Informe ao menos um aviso para reconhecer."),
});
