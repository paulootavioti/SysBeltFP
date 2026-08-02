import type { Frequencia } from "../types";

export interface AproveitamentoMensal {
  chave: string;
  label: string;
  percentual: number;
}

const MESES_ABREVIADOS = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

// Agrupa as presenças por mês (últimos 12 meses com registro) e calcula o
// percentual de presença em cada um — alimenta o gráfico de aproveitamento
// da aba Frequência.
export function calcularAproveitamentoMensal(registros: Frequencia[]): AproveitamentoMensal[] {
  const porMes = new Map<string, { presentes: number; total: number }>();

  for (const registro of registros) {
    const data = new Date(registro.data);
    const chave = `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, "0")}`;

    const acumulado = porMes.get(chave) ?? { presentes: 0, total: 0 };
    acumulado.total += 1;
    if (registro.presente) acumulado.presentes += 1;
    porMes.set(chave, acumulado);
  }

  const chaves = Array.from(porMes.keys()).sort();
  const ultimosDoze = chaves.slice(-12);

  return ultimosDoze.map((chave) => {
    const [, mes] = chave.split("-");
    const { presentes, total } = porMes.get(chave)!;

    return {
      chave,
      label: MESES_ABREVIADOS[Number(mes) - 1],
      percentual: total > 0 ? Math.round((presentes / total) * 100) : 0,
    };
  });
}
