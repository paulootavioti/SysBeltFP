import { z } from "zod";

const numeroOuTexto = z.union([z.string(), z.number()]).nullish();

export const alunoSchema = z.object({
  nome: z.string().min(1, "Informe o nome."),
  apelido: z.string().nullish(),
  dataNascimento: z.string().min(1, "Informe a data de nascimento."),

  sexo: z.string().nullish(),
  cpf: z.string().nullish(),
  rg: z.string().nullish(),

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

  escola: z.string().nullish(),
  serieEscolar: z.string().nullish(),
  turnoEscolar: z.string().nullish(),

  peso: numeroOuTexto,
  altura: numeroOuTexto,

  tamanhoKimono: z.string().nullish(),
  marcaKimono: z.string().nullish(),

  restricoesMedicas: z.string().nullish(),
  alergias: z.string().nullish(),
  medicamentos: z.string().nullish(),
  observacoes: z.string().nullish(),

  fotoUrl: z.string().nullish(),

  faixa: z.string().nullish(),
  grau: numeroOuTexto,
  ativo: z.boolean().nullish(),

  turmaId: numeroOuTexto,
  formaPagamento: z.string().nullish(),
  diaVencimento: numeroOuTexto,
  planoId: numeroOuTexto,
});
