import { z } from "zod";

export const criarSolicitacaoSuporteSchema = z.object({
  mensagem: z.string().trim().min(10, "Descreva o problema com pelo menos 10 caracteres.").max(4000),
  contexto: z.object({
    rota: z.string().max(500).optional(),
    navegador: z.string().max(500).optional(),
  }).optional(),
});
