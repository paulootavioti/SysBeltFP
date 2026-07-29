interface CalcularValorFinalDTO {
  valor: number;
  desconto?: number | null;
  acrescimo?: number | null;
  multa?: number | null;
  juros?: number | null;
}

// valorFinal = valor original - desconto + acréscimo + multa + juros,
// nunca negativo. Persistido em Mensalidade.valorFinal a cada
// criação/atualização, pra não recalcular na leitura toda hora.
export function calcularValorFinal({ valor, desconto, acrescimo, multa, juros }: CalcularValorFinalDTO): number {
  const bruto = valor - (desconto ?? 0) + (acrescimo ?? 0) + (multa ?? 0) + (juros ?? 0);
  return Math.max(0, bruto);
}
