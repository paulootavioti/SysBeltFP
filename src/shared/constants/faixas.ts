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

export const FAIXAS_JUVENIL_ADULTO = ["Branca", "Azul", "Roxa", "Marrom", "Preta"];

interface RegraFaixaAdulta {
  idadeMinima: number;
  tempoMinimoAnos?: number;
}

export const REGRAS_FAIXA_JUVENIL_ADULTO: Record<string, RegraFaixaAdulta> = {
  Azul: { idadeMinima: 16 },
  Roxa: { idadeMinima: 16, tempoMinimoAnos: 2 },
  Marrom: { idadeMinima: 18, tempoMinimoAnos: 1.5 },
  Preta: { idadeMinima: 19 },
};

export function calcularIdade(dataNascimento: Date): number {
  const hoje = new Date();

  let idade = hoje.getFullYear() - dataNascimento.getFullYear();

  const aniversarioNaoChegou =
    hoje.getMonth() < dataNascimento.getMonth() ||
    (hoje.getMonth() === dataNascimento.getMonth() && hoje.getDate() < dataNascimento.getDate());

  if (aniversarioNaoChegou) {
    idade--;
  }

  return idade;
}

export function getTrilhaFaixa(idade: number): "INFANTIL" | "JUVENIL_ADULTO" {
  return idade <= 14 ? "INFANTIL" : "JUVENIL_ADULTO";
}

export function getFaixasDaTrilha(trilha: "INFANTIL" | "JUVENIL_ADULTO") {
  return trilha === "INFANTIL" ? FAIXAS_INFANTIL : FAIXAS_JUVENIL_ADULTO;
}