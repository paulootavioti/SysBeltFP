import { z } from "zod";

export const registrarConsentimentoSchema = z.object({
  alunoId: z.coerce.number().int().positive(),
  tipo: z.enum(["USO_IMAGEM", "BIOMETRIA", "DADOS_SAUDE", "COMUNICACOES"]),
  concedido: z.boolean(),
  // obrigatório na prática quando o aluno é menor — a tela orienta, mas o
  // registro sem responsável continua possível pra aluno adulto.
  responsavelId: z.coerce.number().int().positive().nullish(),
  observacao: z.string().nullish(),
});
