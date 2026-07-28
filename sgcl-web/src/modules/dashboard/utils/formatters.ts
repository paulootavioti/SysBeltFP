const formatadorMoeda = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const formatadorPercentual = new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 1 });
const formatadorNumero = new Intl.NumberFormat("pt-BR");
const formatadorDecimal = new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 1 });
const formatadorData = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });

export function formatarMoeda(valor: number): string {
  return formatadorMoeda.format(valor);
}

export function formatarPercentual(valor: number): string {
  return `${formatadorPercentual.format(valor)}%`;
}

export function formatarNumero(valor: number): string {
  return formatadorNumero.format(valor);
}

export function formatarDecimal(valor: number): string {
  return formatadorDecimal.format(valor);
}

export function formatarData(data: string | Date): string {
  return formatadorData.format(new Date(data));
}
