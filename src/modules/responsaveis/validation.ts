import { z } from "zod";

export const responsavelSchema = z.object({
  nome: z.string().min(1, "Informe o nome."),
  apelido: z.string().nullish(),

  cpf: z.string().nullish(),
  rg: z.string().nullish(),

  dataNascimento: z.string().nullish(),
  sexo: z.string().nullish(),

  telefone: z.string().nullish(),
  whatsapp: z.string().nullish(),
  email: z.union([z.literal(""), z.string().email("E-mail inválido.")]).nullish(),

  cep: z.string().nullish(),
  logradouro: z.string().nullish(),
  numero: z.string().nullish(),
  complemento: z.string().nullish(),
  bairro: z.string().nullish(),
  cidade: z.string().nullish(),
  uf: z.string().nullish(),

  parentesco: z.string().min(1, "Informe o parentesco."),

  responsavelFinanceiro: z.boolean().nullish(),
  podeBuscar: z.boolean().nullish(),
  contatoEmergencia: z.boolean().nullish(),
  recebeComunicados: z.boolean().nullish(),

  observacoes: z.string().nullish(),
  fotoUrl: z.string().nullish(),

  alunoId: z.coerce.number().int("Informe o aluno."),
});
