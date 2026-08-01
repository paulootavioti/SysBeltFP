import { z } from "zod";

export const loginFamiliaSchema = z.object({
  email: z.string().email("Informe um e-mail válido."),
  senha: z.string().min(1, "Informe a senha."),
});

export const pagarMensalidadeFamiliaSchema = z.object({
  alunoId: z.coerce.number().int().positive("Informe o aluno."),
});

export const enviarMensagemFamiliaSchema = z.object({
  alunoId: z.coerce.number().int().positive("Informe o aluno."),
  texto: z.string().min(1, "Escreva uma mensagem."),
});
