export type Periodo = "DIARIO" | "SEMANAL" | "MENSAL" | "ANUAL";

export type UnidadeBucket = "HORA" | "DIA" | "MES";

export interface RangePeriodo {
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

// Igual a `montarSerie`, mas devolve os itens de cada bucket (em vez de um
// total único) — usado quando o gráfico precisa de mais de um valor por
// bucket (ex.: recebido/previsto/pendente/vencido no mesmo dia).
export function agruparPorBucket<T>(
  range: RangePeriodo,
  itens: T[],
  dataDoItem: (item: T) => Date
): { rotulo: string; itens: T[] }[] {
  const buckets = gerarBucketsVazios(range);
  const grupos = new Map(buckets.map((b) => [b.chave, [] as T[]]));

  itens.forEach((item) => {
    const chave = chaveBucket(dataDoItem(item), range.unidade);
    const grupo = grupos.get(chave);
    if (grupo) grupo.push(item);
  });

  return buckets.map((b) => ({ rotulo: b.rotulo, itens: grupos.get(b.chave) ?? [] }));
}

// Janela imediatamente anterior ao período atual, com a mesma duração —
// base de comparação para as variações percentuais (RN de "período anterior").
export function calcularRangePeriodoAnterior(periodo: Periodo, agora: Date = new Date()): RangePeriodo {
  const atual = calcularRangePeriodo(periodo, agora);

  switch (periodo) {
    case "DIARIO": {
      const inicio = new Date(atual.inicio);
      inicio.setDate(inicio.getDate() - 1);
      return { inicio, fim: atual.inicio, unidade: "HORA" };
    }

    case "SEMANAL": {
      const inicio = new Date(atual.inicio);
      inicio.setDate(inicio.getDate() - 7);
      return { inicio, fim: atual.inicio, unidade: "DIA" };
    }

    case "MENSAL": {
      const inicio = new Date(atual.inicio.getFullYear(), atual.inicio.getMonth() - 1, 1);
      return { inicio, fim: atual.inicio, unidade: "DIA" };
    }

    case "ANUAL": {
      const inicio = new Date(atual.inicio.getFullYear() - 1, 0, 1);
      return { inicio, fim: atual.inicio, unidade: "MES" };
    }
  }
}

export interface DivisaoPeriodo {
  quantidade: number;
  unidadeTexto: string;
}

// Em quantas fatias o período se divide, pra calcular médias (receita
// média, média de novas matrículas) — ver regra de negócio do dashboard.
export function divisoesDoPeriodo(periodo: Periodo, agora: Date = new Date()): DivisaoPeriodo {
  switch (periodo) {
    case "DIARIO":
      return { quantidade: 24, unidadeTexto: "por hora" };

    case "SEMANAL":
      return { quantidade: 7, unidadeTexto: "por dia" };

    case "MENSAL": {
      const diasNoMes = new Date(agora.getFullYear(), agora.getMonth() + 1, 0).getDate();
      return { quantidade: Math.max(1, Math.ceil(diasNoMes / 7)), unidadeTexto: "por semana" };
    }

    case "ANUAL":
      return { quantidade: 12, unidadeTexto: "por mês" };
  }
}

export interface Variacao {
  // null = sem base de comparação (período anterior zerado e período atual
  // não) — o front deve mostrar "Novo no período", nunca uma % artificial.
  percentual: number | null;
}

// variacaoPercentual = ((atual - anterior) / anterior) * 100, protegido
// contra divisão por zero.
export function calcularVariacaoPercentual(atual: number, anterior: number): Variacao {
  if (anterior === 0) {
    return { percentual: atual === 0 ? 0 : null };
  }

  return { percentual: ((atual - anterior) / anterior) * 100 };
}
