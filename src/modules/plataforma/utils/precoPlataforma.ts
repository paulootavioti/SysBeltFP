// Regra de preço da assinatura da plataforma: cobrança por faixa de alunos.
//
// A cada `alunosPorBloco` alunos ativos cobra-se `precoPorBlocoCentavos`, e
// a faixa é sempre arredondada PRA CIMA — 41 alunos ocupam 5 faixas de 10,
// não 4,1. É o que faz o preço acompanhar o tamanho do assinante: 50 alunos
// em faixas de 10 a R$ 37,00 dão R$ 185,00.
//
// Função pura de propósito: é o cálculo que decide quanto o cliente paga,
// então precisa ser conferível sem banco, sem rede e sem relógio.

export interface ParametrosPreco {
  alunosPorBloco: number;
  precoPorBlocoCentavos: number;
  // Piso da fatura, em blocos. Com 1 (o padrão), um assinante ativo que
  // esteja sem nenhum aluno cadastrado paga uma faixa em vez de zero —
  // assinatura ativa sempre tem uma mensalidade. Quem quiser que "sem
  // aluno" custe nada configura 0 no plano.
  blocosMinimos?: number;
}

export interface PrecoCalculado {
  alunosContados: number;
  alunosPorBloco: number;
  blocos: number;
  precoPorBlocoCentavos: number;
  valorCentavos: number;
}

export function calcularPrecoPorFaixa(
  alunosContados: number,
  parametros: ParametrosPreco
): PrecoCalculado {
  const { alunosPorBloco, precoPorBlocoCentavos } = parametros;
  const blocosMinimos = parametros.blocosMinimos ?? 1;

  if (!Number.isInteger(alunosPorBloco) || alunosPorBloco <= 0) {
    throw new Error("alunosPorBloco precisa ser um inteiro maior que zero.");
  }

  if (!Number.isInteger(precoPorBlocoCentavos) || precoPorBlocoCentavos < 0) {
    throw new Error("precoPorBlocoCentavos precisa ser um inteiro em centavos.");
  }

  if (!Number.isInteger(alunosContados) || alunosContados < 0) {
    throw new Error("alunosContados precisa ser um inteiro não negativo.");
  }

  // Teto por aritmética inteira em vez de Math.ceil(a / b): dividir em
  // ponto flutuante e arredondar pode devolver uma faixa a mais quando a
  // divisão não é exata em binário, e uma faixa a mais é dinheiro cobrado
  // a mais.
  const blocosNecessarios = Math.floor((alunosContados + alunosPorBloco - 1) / alunosPorBloco);
  const blocos = Math.max(blocosMinimos, blocosNecessarios);

  return {
    alunosContados,
    alunosPorBloco,
    blocos,
    precoPorBlocoCentavos,
    valorCentavos: blocos * precoPorBlocoCentavos,
  };
}

/** Centavos -> "R$ 185,00", pra exibir em tela e em mensagem de cobrança. */
export function formatarCentavos(centavos: number): string {
  return (centavos / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

// ---------------------------------------------------------------------
// Cobrança por UNIDADE.
//
// Cada unidade é uma licença: paga no mínimo uma faixa, e cresce com os
// alunos DELA. O total é a soma das unidades — não o total de alunos da
// academia dividido por 10.
//
// A diferença é material. Uma rede com três unidades de 5 alunos paga 3
// faixas (R$ 111), e não 2 (R$ 74, que é o que daria somar 15 alunos e
// dividir). É o que faz a licença por unidade valer alguma coisa.
//
// Aluno vinculado a duas unidades conta nas DUAS, por decisão comercial:
// ele ocupa vaga, tatame e atenção em cada uma. O cadastro dele continua
// sendo um só — os dados são compartilhados entre as filiais —, o que se
// duplica é a lotação, não a pessoa.

export interface ContagemDaUnidade {
  unidadeId: number;
  nomeUnidade: string;
  /** alunos ativos LOTADOS nesta unidade (um aluno pode estar em várias) */
  alunosContados: number;
}

export interface PrecoDaUnidade extends ContagemDaUnidade {
  blocos: number;
  valorCentavos: number;
}

export interface PrecoPorUnidade {
  unidades: PrecoDaUnidade[];
  /** soma das lotações — pode ser maior que o nº de pessoas distintas */
  totalLotacoes: number;
  totalBlocos: number;
  valorCentavos: number;
}

export function calcularPrecoPorUnidade(
  contagens: ContagemDaUnidade[],
  parametros: ParametrosPreco
): PrecoPorUnidade {
  const unidades = contagens.map((contagem) => {
    const preco = calcularPrecoPorFaixa(contagem.alunosContados, parametros);

    return {
      ...contagem,
      blocos: preco.blocos,
      valorCentavos: preco.valorCentavos,
    };
  });

  return {
    unidades,
    totalLotacoes: unidades.reduce((total, u) => total + u.alunosContados, 0),
    totalBlocos: unidades.reduce((total, u) => total + u.blocos, 0),
    valorCentavos: unidades.reduce((total, u) => total + u.valorCentavos, 0),
  };
}
