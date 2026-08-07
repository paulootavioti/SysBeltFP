import { z } from "zod";

export const turmaSchema = z.object({
  nome: z.string().min(3, "Informe o nome da turma."),
  faixaEtaria: z.string().min(1, "Informe a faixa etária."),
  diasSemana: z.array(z.number()).min(1, "Selecione ao menos um dia da semana."),
  horarioInicio: z.string().min(1, "Informe o horário de início."),
  horarioFim: z.string().min(1, "Informe o horário de término."),
  professorId: z.string().min(1, "Selecione o professor."),
  arenaId: z.string().optional(),
  curriculoId: z.string().optional(),
  modalidadeId: z.string().optional(),
  limiteAlunos: z.string().optional(),
});

export type TurmaFormData = z.infer<typeof turmaSchema>;