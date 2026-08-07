export interface Modalidade {
  id: number;
  nome: string;
  descricao: string | null;
  publicoAlvo: string | null;
  coordenadorId: number | null;
  visivelNaLanding: boolean;
  ordem: number;
  ativo: boolean;
  unidade?: { id: number; nome: string } | null;
  coordenador?: { id: number; nome: string } | null;
  _count?: { turmas: number; curriculos: number };
  createdAt: string;
}
