import { z } from "zod";

export const updatePerfilSchema = z.object({
  perfil: z.enum(["ADMIN", "PROFESSOR", "RECEPCAO"]),
});

export const updateUsuarioSchema = z.object({
  nome: z.string().min(1, "Informe o nome."),
  apelido: z.string().nullish(),
  email: z.string().min(1, "Informe o e-mail.").email("E-mail inválido."),
  senha: z
    .union([z.literal(""), z.string().min(6, "A senha precisa ter pelo menos 6 caracteres.")])
    .nullish(),
  perfil: z.enum(["ADMIN", "PROFESSOR", "RECEPCAO"]),
  nivelGraduacao: z.string().nullish(),
  outrasGraduacoes: z.string().nullish(),
  fotoUrl: z.string().nullish(),
});
