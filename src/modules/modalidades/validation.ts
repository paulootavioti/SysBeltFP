import { z } from "zod";

const camposModalidade = {
  nome: z.string().min(1, "Informe o nome da modalidade."),
  descricao: z.string().nullish(),
  publicoAlvo: z.string().nullish(),
  coordenadorId: z.coerce.number().int().positive().nullish(),
  visivelNaLanding: z.boolean().optional(),
  ordem: z.coerce.number().int().min(0).optional(),
};

export const criarModalidadeSchema = z.object({
  ...camposModalidade,
  // só é lido quando quem cadastra é SUPERADMIN — um ADMIN sempre cadastra
  // dentro da própria unidade, e aí o campo é ignorado.
  unidadeId: z.coerce.number().int().positive().nullish(),
});

// modalidade pertence a uma unidade fixa — editar não a troca de lugar.
export const atualizarModalidadeSchema = z.object(camposModalidade);
