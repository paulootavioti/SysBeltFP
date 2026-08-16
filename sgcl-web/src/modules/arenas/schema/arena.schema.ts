import { z } from "zod";

export const arenaSchema = z.object({
  nome: z.string().min(1, "Informe o nome da arena."),
  // Mantido temporariamente para compatibilidade; o cadastro usa a unidade ativa.
  unidadeId: z.string().optional(),
});

export type ArenaFormData = z.infer<typeof arenaSchema>;
