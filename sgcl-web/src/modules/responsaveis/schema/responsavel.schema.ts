import { z } from "zod";

export const responsavelSchema = z.object({
  nome: z.string().min(3, "Informe o nome do responsável."),

  parentesco: z.string().min(2, "Informe o parentesco."),

  telefone: z.string().optional().nullable(),

  whatsapp: z.string().optional().nullable(),

  email: z
    .string()
    .email("Email inválido.")
    .optional()
    .or(z.literal(""))
    .nullable(),

  cpf: z.string().optional().nullable(),

  rg: z.string().optional().nullable(),

  dataNascimento: z.string().optional().nullable(),

  sexo: z.string().optional().nullable(),

  cep: z.string().optional().nullable(),

  logradouro: z.string().optional().nullable(),

  numero: z.string().optional().nullable(),

  complemento: z.string().optional().nullable(),

  bairro: z.string().optional().nullable(),

  cidade: z.string().optional().nullable(),

  uf: z.string().optional().nullable(),

  responsavelFinanceiro: z.boolean(),

  podeBuscar: z.boolean(),

  contatoEmergencia: z.boolean(),

  recebeComunicados: z.boolean(),

  observacoes: z.string().optional().nullable(),
});

export type ResponsavelFormData = z.infer<typeof responsavelSchema>;
