export type Periodo = "DIARIO" | "SEMANAL" | "MENSAL" | "ANUAL";

export type UnidadeBucket = "HORA" | "DIA" | "MES";

interface RangePeriodo {
  inicio: Date;
  fim: Date;
  unidade: UnidadeBucket;
}

const MESES_ABREVIADOS = [
  "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
  "Jul", "Ago", "Set", "Out", "Nov", "Dez",
];

export function calcularRangePeriodo(periodo: Periodo, agora: Date = new Date()): RangePeriodo {
  const hoje = new Date(agora);
  hoje.setHours(0, 0, 0, 0);

  const amanha = new Date(hoje);
  amanha.setDate(amanha.getDate() + 1);

  switch (periodo) {
    case "DIARIO":
      return { inicio: hoje, fim: amanha, unidade: "HORA" };

    case "SEMANAL": {
      const inicio = new Date(hoje);
      inicio.setDate(inicio.getDate() - 6);
      return { inicio, fim: amanha, unidade: "DIA" };
    }

    case "MENSAL": {
      const inicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
      return { inicio, fim: amanha, unidade: "DIA" };
    }

    case "ANUAL": {
      const inicio = new Date(hoje.getFullYear(), 0, 1);
      return { inicio, fim: amanha, unidade: "MES" };
    }
  }
}

function chaveBucket(data: Date, unidade: UnidadeBucket): string {
  if (unidade === "HORA") return String(data.getHours()).padStart(2, "0");
  if (unidade === "MES") return `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, "0")}`;
  return `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, "0")}-${String(data.getDate()).padStart(2, "0")}`;
}

function rotuloBucket(data: Date, unidade: UnidadeBucket): string {
  if (unidade === "HORA") return `${String(data.getHours()).padStart(2, "0")}h`;
  if (unidade === "MES") return MESES_ABREVIADOS[data.getMonth()];
  return `${String(data.getDate()).padStart(2, "0")}/${String(data.getMonth() + 1).padStart(2, "0")}`;
}

function gerarBucketsVazios(range: RangePeriodo): { chave: string; rotulo: string }[] {
  const buckets: { chave: string; rotulo: string }[] = [];
  const cursor = new Date(range.inicio);

  while (cursor < range.fim) {
    buckets.push({ chave: chaveBucket(cursor, range.unidade), rotulo: rotuloBucket(cursor, range.unidade) });

    if (range.unidade === "HORA") cursor.setHours(cursor.getHours() + 1);
    else if (range.unidade === "MES") cursor.setMonth(cursor.getMonth() + 1);
    else cursor.setDate(cursor.getDate() + 1);
  }

  return buckets;
}

export interface PontoSerie {
  rotulo: string;
  valor: number;
}

export function montarSerie(
  range: RangePeriodo,
  itens: Date[],
  valorPorItem?: (indice: number) => number
): PontoSerie[] {
  const buckets = gerarBucketsVazios(range);
  const totais = new Map(buckets.map((b) => [b.chave, 0]));

  itens.forEach((data, indice) => {
    const chave = chaveBucket(data, range.unidade);
    const atual = totais.get(chave);
    if (atual === undefined) return;
    totais.set(chave, atual + (valorPorItem ? valorPorItem(indice) : 1));
  });

  return buckets.map((b) => ({ rotulo: b.rotulo, valor: totais.get(b.chave) ?? 0 }));
}
