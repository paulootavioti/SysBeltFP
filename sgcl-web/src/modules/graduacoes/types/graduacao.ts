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

// Trilha Infantil (Kids e Teens, até 14 anos)
export const FAIXAS_INFANTIL = [
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

// Trilha Juvenil/Adulta (a partir de 15 anos)
export const FAIXAS_JUVENIL_ADULTO = ["Branca", "Azul", "Roxa", "Marrom", "Preta"];

export interface RegraFaixaAdulta {
  idadeMinima: number;
  tempoMinimoAnos?: number;
}

export const REGRAS_FAIXA_JUVENIL_ADULTO: Record<string, RegraFaixaAdulta> = {
  Azul: { idadeMinima: 16 },
  Roxa: { idadeMinima: 16, tempoMinimoAnos: 2 },
  Marrom: { idadeMinima: 18, tempoMinimoAnos: 1.5 },
  Preta: { idadeMinima: 19 },
};

export function calcularIdade(dataNascimento: string): number {
  const nascimento = new Date(dataNascimento);
  const hoje = new Date();

  let idade = hoje.getFullYear() - nascimento.getFullYear();

  const aniversarioNaoChegou =
    hoje.getMonth() < nascimento.getMonth() ||
    (hoje.getMonth() === nascimento.getMonth() && hoje.getDate() < nascimento.getDate());

  if (aniversarioNaoChegou) {
    idade--;
  }

  return idade;
}

export function getTrilhaFaixa(idade: number): "INFANTIL" | "JUVENIL_ADULTO" {
  return idade <= 14 ? "INFANTIL" : "JUVENIL_ADULTO";
}

export function getFaixasDaTrilha(idade: number) {
  return getTrilhaFaixa(idade) === "INFANTIL" ? FAIXAS_INFANTIL : FAIXAS_JUVENIL_ADULTO;
}

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
  "Azul": { background: "#2563EB", color: "#FFFFFF" },
  "Roxa": { background: "#7C3AED", color: "#FFFFFF" },
  "Marrom": { background: "#78350F", color: "#FFFFFF" },
  "Preta": { background: "#111827", color: "#FFFFFF" },
};