import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    setupFiles: ["src/shared/testing/setupEnv.ts"],
    // A suíte de integração executa transações reais no PostgreSQL. Em
    // máquinas sob carga, o limite padrão de 5s interrompia uma transação no
    // meio e fazia o cleanup do teste seguinte falhar por chave estrangeira.
    testTimeout: 15_000,
    // os testes de integração leem/escrevem no mesmo Postgres de teste; rodar
    // arquivos em paralelo causa corridas reais entre conexões concorrentes
    // (ex.: um arquivo apaga uma Turma no instante em que outro ainda tem uma
    // FK pendente pra ela), então roda um arquivo de cada vez.
    fileParallelism: false,
  },
});
