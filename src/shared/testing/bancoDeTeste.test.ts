import { describe, expect, it } from "vitest";

import { avaliarBancoDeTeste, exigirBancoDeTeste } from "./bancoDeTeste";

// Esta trava existe porque a suíte apaga registros. Se ela falhar aberto,
// um `npm test` distraído roda contra o banco da academia.

const PRODUCAO = "postgresql://user:senha@ep-lucky-waterfall.sa-east-1.aws.neon.tech:5432/neondb";

describe("bancos aceitos", () => {
  it("aceita Postgres na própria máquina", () => {
    expect(avaliarBancoDeTeste("postgresql://postgres@localhost:5432/sysbelt_test").seguro).toBe(true);
    expect(avaliarBancoDeTeste("postgresql://postgres@127.0.0.1:5432/qualquer_nome").seguro).toBe(true);
  });

  it("aceita a URL exata que o CI usa, com query string", () => {
    // se a trava recusasse esta, o pipeline pararia de rodar os testes.
    expect(
      avaliarBancoDeTeste(
        "postgresql://postgres:postgres@localhost:5432/sysbelt_test?schema=public"
      ).seguro
    ).toBe(true);
  });

  it("aceita banco remoto cujo nome se identifica como de teste", () => {
    // é o caso do Postgres do CI e de um branch de teste do Neon.
    expect(avaliarBancoDeTeste("postgresql://u:p@db.interno:5432/sysbelt_test").seguro).toBe(true);
    expect(avaliarBancoDeTeste("postgresql://u:p@db.interno:5432/teste_sysbelt").seguro).toBe(true);
    expect(avaliarBancoDeTeste("postgresql://u:p@db.interno:5432/app-testing").seguro).toBe(true);
  });
});

describe("bancos recusados", () => {
  it("recusa o banco de produção", () => {
    const avaliacao = avaliarBancoDeTeste(PRODUCAO);

    expect(avaliacao.seguro).toBe(false);
    expect(avaliacao.motivo).toContain("neondb");
  });

  it("não se deixa enganar por 'test' no meio de outra palavra", () => {
    // "contest" e "latest" contêm "test" mas não são bancos de teste.
    expect(avaliarBancoDeTeste("postgresql://u:p@remoto:5432/contest").seguro).toBe(false);
    expect(avaliarBancoDeTeste("postgresql://u:p@remoto:5432/latest_db").seguro).toBe(false);
  });

  it("recusa URL ausente ou malformada em vez de deixar passar", () => {
    expect(avaliarBancoDeTeste(undefined).seguro).toBe(false);
    expect(avaliarBancoDeTeste("").seguro).toBe(false);
    expect(avaliarBancoDeTeste("isto não é uma url").seguro).toBe(false);
  });
});

describe("exigirBancoDeTeste", () => {
  it("interrompe a suíte com instrução do que fazer", () => {
    expect(() => exigirBancoDeTeste({ DATABASE_URL: PRODUCAO } as NodeJS.ProcessEnv)).toThrow(
      /\.env\.test/
    );
  });

  it("passa sem reclamar quando o banco é local", () => {
    expect(() =>
      exigirBancoDeTeste({
        DATABASE_URL: "postgresql://postgres@localhost:5432/sysbelt_test",
      } as NodeJS.ProcessEnv)
    ).not.toThrow();
  });

  it("permite a exceção consciente, mas só com a variável explícita", () => {
    expect(() =>
      exigirBancoDeTeste({
        DATABASE_URL: PRODUCAO,
        PERMITIR_TESTE_EM_BANCO_REAL: "1",
      } as NodeJS.ProcessEnv)
    ).not.toThrow();

    // qualquer outro valor não vale — evita liberar sem querer.
    expect(() =>
      exigirBancoDeTeste({
        DATABASE_URL: PRODUCAO,
        PERMITIR_TESTE_EM_BANCO_REAL: "true",
      } as NodeJS.ProcessEnv)
    ).toThrow();
  });
});
