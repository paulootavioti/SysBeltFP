import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    setupFiles: ["src/shared/testing/setupEnv.ts"],
    // os testes de integração leem/escrevem no mesmo Postgres de teste; rodar
    // arquivos em paralelo causa corridas reais entre conexões concorrentes
    // (ex.: um arquivo apaga uma Turma no instante em que outro ainda tem uma
    // FK pendente pra ela), então roda um arquivo de cada vez.
    fileParallelism: false,
  },
});
