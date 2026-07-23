import { z } from "zod";

const usuarioBaseSchema = z.object({
  nome: z.string().min(3, "Informe o nome."),
  apelido: z.string().optional(),
  email: z.string().email("Email inválido."),
  perfil: z
    .string()
    .refine(
      (p) => ["ADMIN", "PROFESSOR", "RECEPCAO"].includes(p),
      "Selecione um perfil."
    ),
  nivelGraduacao: z.string().optional(),
  outrasGraduacoes: z.string().optional(),
  fotoUrl: z.string().nullish(),
});

export const usuarioSchema = usuarioBaseSchema.extend({
  senha: z.string().min(6, "A senha deve ter pelo menos 6 caracteres."),
});

export const usuarioUpdateSchema = usuarioBaseSchema.extend({
  senha: z.union([z.literal(""), z.string().min(6, "A senha deve ter pelo menos 6 caracteres.")]).optional(),
});

export type UsuarioFormData = z.infer<typeof usuarioSchema>;
export type UsuarioUpdateFormData = z.infer<typeof usuarioUpdateSchema>;