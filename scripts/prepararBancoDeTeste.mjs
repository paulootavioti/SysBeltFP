// Prepara o banco da suíte de testes: cria o banco se não existir e
// aplica as migrations. Lê o .env.test, nunca o .env — a ideia é
// justamente não encostar no banco de produção.
//
// Sem dependência nova: usa o dotenv que o projeto já tem.

import { existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";

import { config } from "dotenv";

const arquivo = resolve(process.cwd(), ".env.test");

if (!existsSync(arquivo)) {
  console.error(
    "\n.env.test não encontrado.\n\n" +
      "Copie o exemplo e ajuste usuário/senha do seu Postgres:\n" +
      "  cp .env.test.example .env.test\n"
  );
  process.exit(1);
}

config({ path: arquivo, override: true });

const url = process.env.DATABASE_URL;

if (!url) {
  console.error("DATABASE_URL ausente no .env.test.");
  process.exit(1);
}

const endereco = new URL(url);
const nomeBanco = endereco.pathname.replace(/^\//, "");

// createdb falha se o banco já existir — isso é esperado e não é erro.
const criacao = spawnSync(
  "psql",
  [`${endereco.protocol}//${endereco.username}${endereco.password ? ":" + endereco.password : ""}@${endereco.host}/postgres`,
   "-tAc", `SELECT 1 FROM pg_database WHERE datname='${nomeBanco}'`],
  { encoding: "utf8" }
);

if (criacao.status === 0 && criacao.stdout.trim() !== "1") {
  console.log(`Criando banco "${nomeBanco}"...`);

  const resultado = spawnSync(
    "psql",
    [`${endereco.protocol}//${endereco.username}${endereco.password ? ":" + endereco.password : ""}@${endereco.host}/postgres`,
     "-c", `CREATE DATABASE "${nomeBanco}"`],
    { stdio: "inherit" }
  );

  if (resultado.status !== 0) {
    console.error(`\nNão consegui criar o banco. Crie à mão:\n  createdb ${nomeBanco}\n`);
    process.exit(1);
  }
} else if (criacao.status !== 0) {
  // psql pode não estar no PATH — seguir mesmo assim: se o banco já
  // existir, o migrate deploy funciona.
  console.warn("Não consegui verificar se o banco existe (psql indisponível). Seguindo.");
}

console.log(`Aplicando migrations em "${nomeBanco}"...`);

const migrate = spawnSync("npx", ["prisma", "migrate", "deploy"], {
  stdio: "inherit",
  env: process.env,
});

process.exit(migrate.status ?? 1);
