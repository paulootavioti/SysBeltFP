import { z } from "zod";
export const usuarioSchema = z.object({
  nome: z.string().min(3, "Informe o nome."),
  apelido: z.string().optional(),
  email: z.string().email("Email inválido."),
  senha: z.string().min(6, "A senha deve ter pelo menos 6 caracteres."),
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
export type UsuarioFormData = z.infer<typeof usuarioSchema>;