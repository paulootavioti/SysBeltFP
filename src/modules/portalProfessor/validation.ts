import { z } from "zod";

export const marcarPresencaSchema = z.object({
  alunoId: z.coerce.number().int().positive("Informe o aluno."),
  presente: z.boolean(),
});

export const marcarTecnicaSchema = z.object({
  tecnicaId: z.coerce.number().int().positive("Informe a técnica."),
  executada: z.boolean(),
});

export const criarNotaAulaSchema = z
  .object({
    alunoId: z.coerce.number().int().positive("Informe o aluno."),
    tag: z.string().trim().min(1).max(60).nullish(),
    texto: z.string().trim().min(1).max(1000).nullish(),
  })
  .refine((data) => !!data.tag || !!data.texto, {
    message: "Informe uma tag ou um texto para a nota.",
  });

export const registrarObservacaoAulaSchema = z.object({
  texto: z.string().trim().min(1, "Informe a observação."),
});

export const finalizarAulaProfessorSchema = z.object({
  observacoes: z.string().trim().nullish(),
});

export const registrarExecucaoBlocoSchema = z.object({
  chaveBloco: z.string().trim().min(1).max(100),
  tipo: z.enum(["AQUECIMENTO", "JOGO", "TECNICA", "SPARRING", "PAUSA", "ALONGAMENTO"]),
  nome: z.string().trim().min(1).max(160),
  ordem: z.coerce.number().int().min(0),
  duracaoPrevistaSegundos: z.coerce.number().int().positive().max(28800),
  duracaoRealSegundos: z.coerce.number().int().min(0).max(28800),
  status: z.enum(["CUMPRIDO", "PULADO"]),
  iniciadoEm: z.string().datetime(),
  finalizadoEm: z.string().datetime(),
  tecnicaId: z.coerce.number().int().positive().nullish(),
});

// campos vêm de multipart/form-data (após o multer), por isso chegam como
// string mesmo o "visivelNaLanding" — normalizado antes do parse do zod.
export const publicarFotoAulaProfessorSchema = z.object({
  legenda: z.string().trim().min(1, "Informe a legenda."),
  visivelNaLanding: z.preprocess((valor) => valor === "true" || valor === true, z.boolean()).default(false),
});
