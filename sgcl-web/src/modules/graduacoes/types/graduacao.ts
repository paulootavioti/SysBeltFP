export interface Graduacao {
  id: number;
  faixa: string;
  data: string;
  alunoId: number;
  aluno?: {
    id: number;
    nome: string;
  };
}

export interface EvolucaoAluno {
  alunoId: number;
  nome: string;
  faixaAtual: string;
  grauAtual: number;
  grauCalculado: number;
  presencas: number;
  faltamParaProximoGrau: number;
  faltamParaProximaFaixa: number;
}

export interface AlunoElegivel {
  id: number;
  nome: string;
  faixa: string;
  grau: number;
  presencas: number;
}

// Belt progression order
export const FAIXAS = [
  "Branca",
  "Cinza e Branca",
  "Cinza",
  "Cinza e Preta",
  "Amarela e Branca",
  "Amarela",
  "Amarela e Preta",
  "Laranja e Branca",
  "Laranja",
  "Laranja e Preta",
  "Verde",
];

// Colors for belts
export const CORES_FAIXA: Record<string, string> = {
  "Branca": "bg-white border-2 border-gray-300",
  "Cinza e Branca": "bg-gray-100 border-2 border-gray-400",
  "Cinza": "bg-gray-300",
  "Cinza e Preta": "bg-gradient-to-r from-gray-300 to-gray-900",
  "Amarela e Branca": "bg-gradient-to-r from-yellow-100 to-white",
  "Amarela": "bg-yellow-400",
  "Amarela e Preta": "bg-gradient-to-r from-yellow-400 to-gray-900",
  "Laranja e Branca": "bg-gradient-to-r from-orange-300 to-white",
  "Laranja": "bg-orange-500",
  "Laranja e Preta": "bg-gradient-to-r from-orange-500 to-gray-900",
  "Verde": "bg-green-500",
};
