import { z } from "zod";

export const criarArenaSchema = z.object({
  nome: z.string().min(1, "Informe o nome da arena."),
  // só é lido quando quem cadastra é SUPERADMIN — um ADMIN normal sempre
  // cadastra dentro da própria unidade, esse campo é ignorado nesse caso.
  unidadeId: z.coerce.number().int().positive().nullish(),
});

// arena já pertence a uma unidade fixa — editar não pode trocá-la de lugar.
export const atualizarArenaSchema = z.object({
  nome: z.string().min(1, "Informe o nome da arena."),
});
