import { z } from "zod";
import { PERFIS } from "../../shared/constants/perfis";

export const updatePerfilSchema = z.object({
  perfil: z.enum(PERFIS),
});

export const updateUsuarioSchema = z.object({
  nome: z.string().min(1, "Informe o nome."),
  apelido: z.string().nullish(),
  email: z.string().min(1, "Informe o e-mail.").email("E-mail inválido."),
  senha: z
    .union([z.literal(""), z.string().min(6, "A senha precisa ter pelo menos 6 caracteres.")])
    .nullish(),
  perfil: z.enum(PERFIS),
  // DONO/ADMIN podem vincular o usuário às filiais da própria academia.
  unidadeIds: z.array(z.coerce.number().int().positive()).nullish(),
  nivelGraduacao: z.string().nullish(),
  outrasGraduacoes: z.string().nullish(),
  fotoUrl: z.string().nullish(),
});
