import { z } from "zod";
import { calcularIdade } from "../../../shared/formatters/data";

export const alunoSchema = z
  .object({
    nome: z.string().min(3, "Informe o nome do aluno."),

    dataNascimento: z.string().min(1, "Informe a data de nascimento."),

    sexo: z.string().optional(),

    cpf: z.string().optional(),

    rg: z.string().optional(),

    telefone: z.string().min(8, "Informe um telefone válido."),

    whatsapp: z.string().optional(),
    email: z
      .string()
      .email("Informe um e-mail válido.")
      .optional()
      .or(z.literal("")),

    cep: z.string().optional(),

    logradouro: z.string().optional(),

    numero: z.string().optional(),

    complemento: z.string().optional(),

    bairro: z.string().optional(),

    cidade: z.string().optional(),

    uf: z.string().optional(),

    escola: z.string().optional(),

    serieEscolar: z.string().optional(),

    turnoEscolar: z.string().optional(),

    peso: z.string().optional(),

    altura: z.string().optional(),

    restricoesMedicas: z.string().optional(),

    alergias: z.string().optional(),

    medicamentos: z.string().optional(),

    tamanhoKimono: z.string().optional(),

    marcaKimono: z.string().optional(),

    observacoes: z.string().optional(),

    turmaId: z.string().optional(),

    fotoUrl: z.string().optional(),

    responsavel: z
      .object({
        id: z.number().optional(),
        nome: z.string().optional(),
        parentesco: z.string().optional(),
        telefone: z.string().optional(),
        whatsapp: z.string().optional(),
        email: z.string().optional(),
        responsavelFinanceiro: z.boolean().optional(),
        podeBuscar: z.boolean().optional(),
        contatoEmergencia: z.boolean().optional(),
        recebeComunicados: z.boolean().optional(),
      })
      .optional(),
  })
  .superRefine((data, ctx) => {
    const idade = calcularIdade(data.dataNascimento);

    if (idade !== null && idade < 18) {
      if (!data.responsavel?.nome) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["responsavel", "nome"],
          message: "Informe o nome do responsável (obrigatório para menores de 18 anos).",
        });
      }

      if (!data.responsavel?.parentesco) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["responsavel", "parentesco"],
          message: "Informe o parentesco.",
        });
      }
    }
  });

export type AlunoFormData = z.infer<typeof alunoSchema>;