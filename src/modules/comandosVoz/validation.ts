import { z } from "zod";

export const comandoVozSchema = z.object({
  gatilho: z.string().trim().min(3).max(160),
  resposta: z.string().trim().min(3).max(300),
  acao: z.enum(["INICIAR", "PAUSAR", "AVANCAR", "CONSULTAR", "BLOCO_PAUSA"]),
  duracaoBlocoSegundos: z.coerce.number().int().positive().max(3600).nullish(),
  avisoAntesFimSegundos: z.union([z.literal(10), z.literal(30)]).nullish(),
}).superRefine((dados, contexto) => {
  if (dados.acao === "BLOCO_PAUSA" && !dados.duracaoBlocoSegundos) {
    contexto.addIssue({ code: "custom", path: ["duracaoBlocoSegundos"], message: "Informe a duração do bloco." });
  }
});

export const parearArenaSchema = z.object({
  arenaId: z.coerce.number().int().positive(),
  consentiu: z.literal(true),
});

export const testarComandoSchema = z.object({ arenaId: z.coerce.number().int().positive() });
export const executarSkillSchema = z.object({ gatilho: z.string().trim().min(1).max(160), turma: z.string().trim().max(100).optional(), n: z.coerce.number().int().positive().optional(), tempo: z.string().trim().max(60).optional() });
