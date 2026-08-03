import { z } from "zod";

export const publicarFotosTreinoSchema = z.object({
  aulaId: z.coerce.number().int().positive(),
  urls: z.array(z.string().min(1)).min(1, "Envie ao menos uma foto."),
  legenda: z.string().min(1, "Informe a legenda."),
  visivelNaLanding: z.boolean().optional().default(false),
});
