import { TIPOS_META_REDUCAO, type MetaDashboard, type StatusMeta, type TipoMeta } from "../types";

// MOCK TEMPORÁRIO — não existe backend de Metas ainda (não há tabela/rota
// própria). Os valores abaixo são ilustrativos, só pra o dashboard e a tela
// de Metas terem o que exibir enquanto o módulo real não é construído.
//
// Quando o backend existir (sugestão: `GET /metas/dashboard`, devolvendo
// exatamente `MetaDashboard[]`), troque só o corpo de `listar()` por uma
// chamada `ApiClient.get<MetaDashboard[]>("/metas/dashboard")` — o restante
// do app (dashboard, página /metas) já consome o mesmo contrato de tipos.
//
// Pra metas de redução (ex.: inadimplência), `valorMeta` é o teto desejado
// e `valorAtual` é o nível atual — por isso o percentual é `valorMeta /
// valorAtual` (invertido): ficar abaixo do teto já supera 100%. Pras
// demais, é o `valorAtual / valorMeta` padrão.
function calcularPercentual(tipo: TipoMeta, valorAtual: number, valorMeta: number): number {
  if (TIPOS_META_REDUCAO.includes(tipo)) {
    return (valorMeta / Math.max(valorAtual, 0.0001)) * 100;
  }
  return (valorAtual / valorMeta) * 100;
}

function calcularStatus(percentual: number, dataLimite: Date): StatusMeta {
  if (percentual >= 100) return "ATINGIDA";
  if (dataLimite < new Date()) return "ATRASADA";
  if (percentual <= 0) return "NAO_INICIADA";
  return "EM_ANDAMENTO";
}

function daquiA(dias: number): string {
  const data = new Date();
  data.setDate(data.getDate() + dias);
  return data.toISOString();
}

function montarMeta(opts: {
  id: string;
  nome: string;
  tipo: TipoMeta;
  valorAtual: number;
  valorMeta: number;
  unidade: MetaDashboard["unidade"];
  prazoDias: number;
}): MetaDashboard {
  const percentualBruto = calcularPercentual(opts.tipo, opts.valorAtual, opts.valorMeta);
  const dataLimite = daquiA(opts.prazoDias);

  return {
    id: opts.id,
    nome: opts.nome,
    tipo: opts.tipo,
    valorAtual: opts.valorAtual,
    valorMeta: opts.valorMeta,
    percentualAtingido: percentualBruto,
    unidade: opts.unidade,
    status: calcularStatus(percentualBruto, new Date(dataLimite)),
    dataLimite,
  };
}

const METAS_MOCK: MetaDashboard[] = [
  montarMeta({
    id: "meta-receita",
    nome: "Meta de Receita",
    tipo: "RECEITA",
    valorAtual: 18500,
    valorMeta: 25000,
    unidade: "MOEDA",
    prazoDias: 16,
  }),
  montarMeta({
    id: "meta-matriculas",
    nome: "Meta de Novas Matrículas",
    tipo: "NOVAS_MATRICULAS",
    valorAtual: 9,
    valorMeta: 15,
    unidade: "QUANTIDADE",
    prazoDias: 16,
  }),
  montarMeta({
    id: "meta-alunos-ativos",
    nome: "Meta de Alunos Ativos",
    tipo: "ALUNOS_ATIVOS",
    valorAtual: 142,
    valorMeta: 150,
    unidade: "QUANTIDADE",
    prazoDias: 45,
  }),
  montarMeta({
    id: "meta-frequencia",
    nome: "Meta de Frequência",
    tipo: "FREQUENCIA",
    valorAtual: 74,
    valorMeta: 85,
    unidade: "PERCENTUAL",
    prazoDias: 30,
  }),
  montarMeta({
    id: "meta-inadimplencia",
    nome: "Meta de Redução da Inadimplência",
    tipo: "INADIMPLENCIA",
    valorAtual: 17,
    valorMeta: 20,
    unidade: "PERCENTUAL",
    prazoDias: 30,
  }),
  montarMeta({
    id: "meta-retencao",
    nome: "Meta de Retenção de Alunos",
    tipo: "RETENCAO",
    valorAtual: 88,
    valorMeta: 90,
    unidade: "PERCENTUAL",
    prazoDias: -5,
  }),
];

export class MetaService {
  static async listar(): Promise<MetaDashboard[]> {
    return Promise.resolve(METAS_MOCK);
  }

  static async listarDashboard(): Promise<MetaDashboard[]> {
    return this.listar();
  }
}
