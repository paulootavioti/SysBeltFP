import { z } from "zod";

export const planoSchema = z.object({
  nome: z.string().min(1, "Informe o nome do plano."),
  valor: z.coerce.number().nonnegative("Informe um valor válido."),
  periodicidade: z.string().min(1, "Informe a periodicidade."),
});
