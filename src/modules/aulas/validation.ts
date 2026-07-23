import { z } from "zod";

export const iniciarAulaSchema = z.object({
  turmaId: z.coerce.number().int().positive("Informe a turma."),
  aulaCurriculoId: z.coerce.number().int().positive().nullish(),
  professor: z.string().nullish(),
  observacoes: z.string().nullish(),
});

export const updateAulaAlunoSchema = z.object({
  presente: z.boolean().nullish(),
  respeito: z.boolean().nullish(),
  valentia: z.boolean().nullish(),
  esforco: z.boolean().nullish(),
  atencao: z.boolean().nullish(),
  disciplina: z.boolean().nullish(),
  observacao: z.string().nullish(),
});

export const criarAulaProgramadaSchema = z.object({
  turmaId: z.coerce.number().int().positive("Informe a turma."),
  aulaCurriculoId: z.coerce.number().int().positive().nullish(),
  data: z.string().min(1, "Informe a data."),
  observacoes: z.string().nullish(),
});

export const updateAulaSchema = z.object({
  jogosRealizados: z.array(z.string()).nullish(),
  tecnicasRealizadasIds: z.array(z.coerce.number().int()).nullish(),
});

export const updateAulaProgramadaSchema = z.object({
  data: z.string().min(1).nullish(),
  aulaCurriculoId: z.coerce.number().int().positive().nullish(),
  observacoes: z.string().nullish(),
});

export const replicarProgramacaoSchema = z.object({
  turmaId: z.coerce.number().int().positive("Informe a turma."),
  aulaCurriculoId: z.coerce.number().int().positive().nullish(),
  dataInicio: z.string().min(1, "Informe a data inicial."),
  dataFim: z.string().min(1, "Informe a data final."),
  diasSemana: z
    .array(z.coerce.number().int().min(0).max(6))
    .min(1, "Selecione ao menos um dia da semana."),
  observacoes: z.string().nullish(),
});
