import { z } from "zod";

import { CATEGORIA_PRODUTO_LABEL } from "../types";

const CATEGORIAS = Object.keys(CATEGORIA_PRODUTO_LABEL) as [string, ...string[]];

export interface VarianteFormData {
  id?: number;
  tamanho: string;
  cor?: string;
  estoque: number;
}

export const produtoSchema = z.object({
  nome: z.string().min(1, "Informe o nome do produto."),
  categoria: z.enum(CATEGORIAS, { message: "Selecione uma categoria." }),
  preco: z.string().min(1, "Informe o preço do produto."),
  descricao: z.string().optional(),
  imagemUrl: z.string().optional(),
});

export type ProdutoFormData = z.infer<typeof produtoSchema>;
