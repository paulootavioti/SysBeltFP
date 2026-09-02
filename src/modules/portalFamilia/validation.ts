import { z } from "zod";

export const loginFamiliaSchema = z.object({
  email: z.string().email("Informe um e-mail válido."),
  senha: z.string().min(1, "Informe a senha."),
});

export const solicitarRedefinicaoSenhaFamiliaSchema = z.object({
  email: z.string().email("Informe um e-mail válido."),
});

export const redefinirSenhaFamiliaSchema = z.object({
  token: z.string().min(32, "Link de redefinição inválido."),
  senha: z.string().min(8, "A nova senha precisa ter pelo menos 8 caracteres."),
});

export const alterarSenhaFamiliaSchema = z.object({
  senhaAtual: z.string().min(1, "Informe a senha atual."),
  novaSenha: z.string().min(8, "A nova senha deve ter pelo menos 8 caracteres."),
});

export const pagarMensalidadeFamiliaSchema = z.object({
  alunoId: z.coerce.number().int().positive("Informe o aluno."),
});

export const enviarMensagemFamiliaSchema = z.object({
  alunoId: z.coerce.number().int().positive("Informe o aluno."),
  texto: z.string().min(1, "Escreva uma mensagem."),
});

export const criarPedidoFamiliaSchema = z.object({
  alunoId: z.coerce.number().int().positive("Informe o aluno."),
  formaPagamentoId: z.coerce.number().int().positive().nullish(),
  itens: z
    .array(
      z.object({
        varianteId: z.coerce.number().int().positive("Item inválido."),
        quantidade: z.coerce.number().int().positive("Quantidade inválida."),
      })
    )
    .min(1, "O carrinho está vazio."),
});

export const pagarPedidoFamiliaSchema = z.object({
  alunoId: z.coerce.number().int().positive("Informe o aluno."),
});
