import { z } from "zod";
import { PERFIS } from "../../shared/constants/perfis";

export const registerSchema = z.object({
  nome: z.string().min(1, "Informe o nome."),
  apelido: z.string().nullish(),
  email: z.string().min(1, "Informe o e-mail.").email("E-mail inválido."),
  senha: z.string().min(6, "A senha precisa ter pelo menos 6 caracteres."),
  perfil: z.enum(PERFIS),
  // Compatibilidade com clientes antigos; a unidade ativa vem da autenticação.
  unidadeId: z.coerce.number().int().positive().nullish(),
  // DONO/ADMIN podem vincular o usuário às filiais da própria academia.
  unidadeIds: z.array(z.coerce.number().int().positive()).nullish(),
  nivelGraduacao: z.string().nullish(),
  outrasGraduacoes: z.string().nullish(),
  fotoUrl: z.string().nullish(),
});

export const loginSchema = z.object({
  email: z.string().min(1, "Informe o e-mail."),
  senha: z.string().min(1, "Informe a senha."),
});

export const loginDoisFatoresSchema = z.object({
  desafio: z.string().min(1, "Desafio de verificação inválido."),
  codigo: z.string().regex(/^\d{6}$/, "Informe o código de 6 dígitos."),
});

export const solicitarRedefinicaoSenhaSchema = z.object({
  email: z.string().email("Informe um e-mail válido."),
  origem: z.enum(["EQUIPE", "PROFESSOR"]).default("EQUIPE"),
});

export const redefinirSenhaSchema = z.object({
  token: z.string().min(32, "Link de redefinição inválido."),
  senha: z.string().min(8, "A nova senha precisa ter pelo menos 8 caracteres."),
});
