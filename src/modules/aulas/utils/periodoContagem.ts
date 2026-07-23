import { calcularSemana } from "./semana";

export type PeriodoContagem = "SEMANAL" | "MENSAL" | "SEMESTRAL" | "ANUAL";

export const PERIODOS_CONTAGEM_VALIDOS: PeriodoContagem[] = [
  "SEMANAL",
  "MENSAL",
  "SEMESTRAL",
  "ANUAL",
];

export function calcularRangeContagem(periodo: PeriodoContagem, referencia: Date = new Date()) {
  switch (periodo) {
    case "SEMANAL":
      return calcularSemana(referencia);

    case "MENSAL": {
      const inicio = new Date(referencia.getFullYear(), referencia.getMonth(), 1);
      const fim = new Date(referencia.getFullYear(), referencia.getMonth() + 1, 0, 23, 59, 59, 999);
      return { inicio, fim };
    }

    case "SEMESTRAL": {
      const mesInicioSemestre = referencia.getMonth() < 6 ? 0 : 6;
      const inicio = new Date(referencia.getFullYear(), mesInicioSemestre, 1);
      const fim = new Date(referencia.getFullYear(), mesInicioSemestre + 6, 0, 23, 59, 59, 999);
      return { inicio, fim };
    }

    case "ANUAL": {
      const inicio = new Date(referencia.getFullYear(), 0, 1);
      const fim = new Date(referencia.getFullYear(), 11, 31, 23, 59, 59, 999);
      return { inicio, fim };
    }
  }
}
