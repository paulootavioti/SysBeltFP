import { z } from "zod";

export const salaSchema = z.object({
  nome: z.string().min(1, "Informe o nome da sala."),
});
