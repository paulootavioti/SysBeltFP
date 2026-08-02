import { z } from "zod";

const CATEGORIAS = [
  "KIMONO",
  "RASHGUARD",
  "BERMUDA",
  "FAIXA",
  "PATCH",
  "CHAVEIRO",
  "PULSEIRA",
  "OUTROS",
] as const;

const varianteSchema = z.object({
  id: z.coerce.number().optional(),
  tamanho: z.string().min(1, "Informe o tamanho da variante."),
  cor: z.string().optional(),
  estoque: z.coerce.number().int().nonnegative("Informe um estoque válido."),
});

export const produtoSchema = z.object({
  nome: z.string().min(1, "Informe o nome do produto."),
  categoria: z.enum(CATEGORIAS, { message: "Selecione uma categoria válida." }),
  preco: z.coerce.number().positive("Informe um preço válido."),
  descricao: z.string().optional(),
  imagemUrl: z.string().optional(),
  variantes: z
    .array(varianteSchema)
    .min(1, "Cadastre ao menos uma variante com tamanho preenchido."),
});
