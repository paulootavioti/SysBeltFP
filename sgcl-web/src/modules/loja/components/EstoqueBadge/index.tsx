import { Badge } from "../../../../components/ui/Badge";
import { varianteEstoque } from "./varianteEstoque";
import type { ProdutoVariante } from "../../types";

interface EstoqueBadgeProps {
  variante: ProdutoVariante;
}

// chip "Tamanho · Cor · N un." usado abaixo de cada produto na listagem.
export function EstoqueBadge({ variante }: EstoqueBadgeProps) {
  const partes = [variante.tamanho, variante.cor, `${variante.estoque} un.`].filter(Boolean);

  return <Badge variant={varianteEstoque(variante.estoque)}>{partes.join(" · ")}</Badge>;
}
