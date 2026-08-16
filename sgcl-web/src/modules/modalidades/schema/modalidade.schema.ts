import { z } from "zod";

export const modalidadeSchema = z.object({
  nome: z.string().min(1, "Informe o nome da modalidade."),
  descricao: z.string().optional(),
  // texto livre que aparece no card da landing, ex.: "4 a 13 anos".
  publicoAlvo: z.string().optional(),
  coordenadorId: z.string().optional(),
  visivelNaLanding: z.boolean().optional(),
  ordem: z.string().optional(),
  // Mantido temporariamente para compatibilidade; o cadastro usa a unidade ativa.
  unidadeId: z.string().optional(),
});

export type ModalidadeFormData = z.infer<typeof modalidadeSchema>;
