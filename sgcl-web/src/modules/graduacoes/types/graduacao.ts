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
export const CORES_FAIXA: Record<string, { background: string; color: string }> = {
  "Branca": { background: "#FFFFFF", color: "#111827" },
  "Cinza e Branca": { background: "linear-gradient(90deg, #FFFFFF 50%, #9CA3AF 50%)", color: "#111827" },
  "Cinza": { background: "#9CA3AF", color: "#111827" },
  "Cinza e Preta": { background: "linear-gradient(90deg, #9CA3AF 50%, #111827 50%)", color: "#FFFFFF" },
  "Amarela e Branca": { background: "linear-gradient(90deg, #FFFFFF 50%, #FACC15 50%)", color: "#111827" },
  "Amarela": { background: "#FACC15", color: "#111827" },
  "Amarela e Preta": { background: "linear-gradient(90deg, #FACC15 50%, #111827 50%)", color: "#FFFFFF" },
  "Laranja e Branca": { background: "linear-gradient(90deg, #FFFFFF 50%, #F97316 50%)", color: "#111827" },
  "Laranja": { background: "#F97316", color: "#FFFFFF" },
  "Laranja e Preta": { background: "linear-gradient(90deg, #F97316 50%, #111827 50%)", color: "#FFFFFF" },
  "Verde": { background: "#22C55E", color: "#FFFFFF" },
};
