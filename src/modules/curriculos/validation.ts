import { z } from "zod";

export const curriculoSchema = z.object({
  nome: z.string().min(1, "Informe o nome do currículo."),
  descricao: z.string().nullish(),
  modalidade: z.string().nullish(),
  publico: z.string().nullish(),
});

export const moduloCurriculoSchema = z.object({
  nome: z.string().min(1, "Informe o nome do módulo."),
  descricao: z.string().nullish(),
  faixa: z.string().nullish(),
  idadeMinima: z.coerce.number().int().nullish(),
  idadeMaxima: z.coerce.number().int().nullish(),
  ordem: z.coerce.number().int().nullish(),
  curriculoId: z.coerce.number().int().positive().optional(),
});

export const aulaCurriculoSchema = z.object({
  titulo: z.string().min(1, "Informe o título da aula."),
  objetivo: z.string().nullish(),
  descricao: z.string().nullish(),
  duracaoMinutos: z.coerce.number().int().nullish(),
  jogosSugeridos: z.string().nullish(),
  ordem: z.coerce.number().int().nullish(),
  moduloId: z.coerce.number().int().positive().optional(),
});

export const tecnicaCurriculoSchema = z.object({
  nome: z.string().min(1, "Informe o nome da técnica."),
  categoria: z.string().nullish(),
  descricao: z.string().nullish(),
  obrigatoria: z.boolean().nullish(),
  ordem: z.coerce.number().int().nullish(),
  aulaCurriculoId: z.coerce.number().int().positive().optional(),
});
