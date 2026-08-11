import { describe, expect, it } from "vitest";

import {
  calcularPrecoPorFaixa,
  calcularPrecoPorUnidade,
  formatarCentavos,
} from "./precoPlataforma";

// Plano de venda: faixas de 10 alunos a R$ 37,00.
const ESSENCIAL = { alunosPorBloco: 10, precoPorBlocoCentavos: 3700 };

describe("cobrança por faixa de alunos", () => {
  it("cobra o exemplo combinado: 50 alunos = R$ 185,00", () => {
    const preco = calcularPrecoPorFaixa(50, ESSENCIAL);

    expect(preco.blocos).toBe(5);
    expect(preco.valorCentavos).toBe(18500);
    // O pt-BR separa "R$" do número com espaço NÃO SEPARÁVEL (U+00A0), não
    // com espaço comum — comparar com " " normal falha por um caractere
    // invisível. Escrito escapado aqui pra que fique visível no código.
    expect(formatarCentavos(preco.valorCentavos)).toBe("R$\u00a0185,00");
  });

  it("arredonda a faixa pra cima — quem passa de 10 já paga a faixa seguinte", () => {
    // o ponto da regra: 11 alunos não custam R$ 40,70 (proporcional),
    // custam duas faixas cheias.
    expect(calcularPrecoPorFaixa(10, ESSENCIAL).valorCentavos).toBe(3700);
    expect(calcularPrecoPorFaixa(11, ESSENCIAL).valorCentavos).toBe(7400);
    expect(calcularPrecoPorFaixa(20, ESSENCIAL).valorCentavos).toBe(7400);
    expect(calcularPrecoPorFaixa(21, ESSENCIAL).valorCentavos).toBe(11100);
  });

  it("atende do pequeno ao grande sem mudar de regra", () => {
    expect(calcularPrecoPorFaixa(8, ESSENCIAL).valorCentavos).toBe(3700); // R$ 37
    expect(calcularPrecoPorFaixa(200, ESSENCIAL).valorCentavos).toBe(74000); // R$ 740
    expect(calcularPrecoPorFaixa(1000, ESSENCIAL).valorCentavos).toBe(370000); // R$ 3.700
  });

  it("assinante ativo sem aluno nenhum paga o piso de uma faixa", () => {
    expect(calcularPrecoPorFaixa(0, ESSENCIAL).blocos).toBe(1);
    expect(calcularPrecoPorFaixa(0, ESSENCIAL).valorCentavos).toBe(3700);
  });

  it("permite piso zero pra quem quiser que 'sem aluno' custe nada", () => {
    const semPiso = { ...ESSENCIAL, blocosMinimos: 0 };

    expect(calcularPrecoPorFaixa(0, semPiso).valorCentavos).toBe(0);
    // com aluno, volta a cobrar normalmente.
    expect(calcularPrecoPorFaixa(1, semPiso).valorCentavos).toBe(3700);
  });

  it("devolve a contagem e os parâmetros usados, pra fatura guardar o histórico", () => {
    const preco = calcularPrecoPorFaixa(37, ESSENCIAL);

    expect(preco).toEqual({
      alunosContados: 37,
      alunosPorBloco: 10,
      blocos: 4,
      precoPorBlocoCentavos: 3700,
      valorCentavos: 14800,
    });
  });

  it("funciona com outras faixas e outros preços", () => {
    const porAluno = { alunosPorBloco: 1, precoPorBlocoCentavos: 500 };
    expect(calcularPrecoPorFaixa(7, porAluno).valorCentavos).toBe(3500);

    const faixaDe25 = { alunosPorBloco: 25, precoPorBlocoCentavos: 9000 };
    expect(calcularPrecoPorFaixa(26, faixaDe25).blocos).toBe(2);
  });
});

describe("parâmetros inválidos param o cálculo em vez de gerar fatura errada", () => {
  it("recusa faixa zero ou negativa", () => {
    expect(() => calcularPrecoPorFaixa(10, { ...ESSENCIAL, alunosPorBloco: 0 })).toThrow();
    expect(() => calcularPrecoPorFaixa(10, { ...ESSENCIAL, alunosPorBloco: -10 })).toThrow();
  });

  it("recusa preço fracionário — centavos são inteiros", () => {
    // 37.5 centavos não existe; quem passar reais no lugar de centavos
    // (37.00) também cai aqui em vez de faturar R$ 0,37.
    expect(() =>
      calcularPrecoPorFaixa(10, { ...ESSENCIAL, precoPorBlocoCentavos: 37.5 })
    ).toThrow();
  });

  it("recusa contagem negativa ou quebrada", () => {
    expect(() => calcularPrecoPorFaixa(-1, ESSENCIAL)).toThrow();
    expect(() => calcularPrecoPorFaixa(10.5, ESSENCIAL)).toThrow();
  });
});

describe("nenhuma faixa a mais por erro de ponto flutuante", () => {
  it("não cobra faixa extra em nenhuma contagem exata até 5000 alunos", () => {
    // a divisão inteira existe justamente pra isto: se alguma contagem
    // múltipla da faixa gerasse um bloco a mais, o cliente pagaria a mais.
    for (let alunos = 10; alunos <= 5000; alunos += 10) {
      expect(calcularPrecoPorFaixa(alunos, ESSENCIAL).blocos).toBe(alunos / 10);
    }
  });
});

describe("cobrança por unidade — cada filial é uma licença", () => {
  const u = (unidadeId: number, nomeUnidade: string, alunosContados: number) => ({
    unidadeId,
    nomeUnidade,
    alunosContados,
  });

  it("cobra o exemplo combinado: Matriz 12 + Filial 8 = 3 faixas = R$ 111,00", () => {
    // 2 desses alunos treinam nas duas unidades e contam nas duas: são 18
    // pessoas distintas, mas 20 lotações.
    const preco = calcularPrecoPorUnidade(
      [u(1, "Matriz", 12), u(2, "Filial", 8)],
      ESSENCIAL
    );

    expect(preco.unidades[0].blocos).toBe(2);
    expect(preco.unidades[1].blocos).toBe(1);
    expect(preco.totalBlocos).toBe(3);
    expect(preco.totalLotacoes).toBe(20);
    expect(preco.valorCentavos).toBe(11100);
  });

  it("NÃO é a mesma coisa que somar os alunos e dividir por 10", () => {
    // três unidades de 5 alunos: 3 licenças (R$ 111), e não 15 alunos
    // divididos em 2 faixas (R$ 74). É o ponto inteiro da mudança.
    const porUnidade = calcularPrecoPorUnidade(
      [u(1, "A", 5), u(2, "B", 5), u(3, "C", 5)],
      ESSENCIAL
    );

    expect(porUnidade.valorCentavos).toBe(11100);
    expect(calcularPrecoPorFaixa(15, ESSENCIAL).valorCentavos).toBe(7400);
  });

  it("unidade recém-aberta, ainda sem aluno, já paga a licença", () => {
    const preco = calcularPrecoPorUnidade([u(1, "Matriz", 30), u(2, "Nova", 0)], ESSENCIAL);

    expect(preco.unidades[1].blocos).toBe(1);
    expect(preco.valorCentavos).toBe(3 * 3700 + 3700);
  });

  it("academia de uma unidade só cobra como antes", () => {
    const preco = calcularPrecoPorUnidade([u(1, "Única", 50)], ESSENCIAL);

    expect(preco.valorCentavos).toBe(18500);
    expect(preco.valorCentavos).toBe(calcularPrecoPorFaixa(50, ESSENCIAL).valorCentavos);
  });

  it("guarda a quebra por unidade, pra fatura explicar o valor", () => {
    const preco = calcularPrecoPorUnidade([u(7, "Centro", 23), u(9, "Sul", 4)], ESSENCIAL);

    expect(preco.unidades).toEqual([
      { unidadeId: 7, nomeUnidade: "Centro", alunosContados: 23, blocos: 3, valorCentavos: 11100 },
      { unidadeId: 9, nomeUnidade: "Sul", alunosContados: 4, blocos: 1, valorCentavos: 3700 },
    ]);
  });

  it("sem unidade nenhuma, não cobra nada", () => {
    expect(calcularPrecoPorUnidade([], ESSENCIAL).valorCentavos).toBe(0);
  });
});
