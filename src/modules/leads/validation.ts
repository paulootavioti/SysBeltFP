import { z } from "zod";

export const atualizarStatusLeadSchema = z.object({
  status: z.enum(["NOVO", "CONTACTADO", "CONVERTIDO"], { message: "Selecione um status válido." }),
});
