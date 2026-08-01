import { z } from "zod";

export const enviarMensagemFamiliaSchema = z.object({
  alunoId: z.coerce.number().int().positive("Informe o aluno."),
  texto: z.string().min(1, "Escreva uma mensagem."),
});
