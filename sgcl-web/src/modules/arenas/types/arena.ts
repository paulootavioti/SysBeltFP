export interface Arena {
  id: number;
  nome: string;
  ativo: boolean;
  unidade?: {
    id: number;
    nome: string;
  } | null;
  createdAt: string;
}
