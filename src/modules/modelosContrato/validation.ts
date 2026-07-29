import { z } from "zod";

export const modeloContratoSchema = z.object({
  nome: z.string().min(1, "Informe o nome do modelo."),
  conteudo: z.string().min(1, "Informe o conteúdo do modelo."),
});
