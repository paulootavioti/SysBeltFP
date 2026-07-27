import { z } from "zod";

export const arenaSchema = z.object({
  nome: z.string().min(1, "Informe o nome da arena."),
  // só é exibido/obrigatório pro superadmin — um admin normal sempre
  // cadastra dentro da própria unidade.
  unidadeId: z.string().optional(),
});

export type ArenaFormData = z.infer<typeof arenaSchema>;
