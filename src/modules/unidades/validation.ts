import { z } from "zod";

export const unidadeSchema = z.object({
  nome: z.string().min(1, "Informe o nome da unidade."),
  // só é lido quando quem cria é SUPERADMIN sem unidade ativa — um ADMIN
  // sempre abre filial na própria conta (ver controller).
  contaId: z.number().int().positive().nullish(),
});
