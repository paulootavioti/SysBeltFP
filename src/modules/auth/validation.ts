import { z } from "zod";

export const registerSchema = z.object({
  nome: z.string().min(1, "Informe o nome."),
  apelido: z.string().nullish(),
  email: z.string().min(1, "Informe o e-mail.").email("E-mail inválido."),
  senha: z.string().min(6, "A senha precisa ter pelo menos 6 caracteres."),
  perfil: z.enum(["ADMIN", "PROFESSOR", "RECEPCAO"]),
  nivelGraduacao: z.string().nullish(),
  outrasGraduacoes: z.string().nullish(),
  fotoUrl: z.string().nullish(),
});

export const loginSchema = z.object({
  email: z.string().min(1, "Informe o e-mail."),
  senha: z.string().min(1, "Informe a senha."),
});
