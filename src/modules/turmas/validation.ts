import { z } from "zod";

export const turmaSchema = z.object({
  nome: z.string().min(1, "Informe o nome da turma."),
  faixaEtaria: z.string().min(1, "Informe a faixa etária."),
  diasSemana: z
    .array(z.number().int().min(0, "Dia da semana inválido.").max(6, "Dia da semana inválido."))
    .min(1, "Selecione ao menos um dia da semana."),
  horarioInicio: z.string().min(1, "Informe o horário de início."),
  horarioFim: z.string().min(1, "Informe o horário de término."),
  professorId: z.coerce.number().int().positive().nullish(),
  salaId: z.coerce.number().int().positive().nullish(),
  limiteAlunos: z.coerce.number().int().positive().nullish(),
  curriculoId: z.coerce.number().int().positive().nullish(),
});
