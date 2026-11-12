// Restaura um backup num banco VAZIO e separado, confere o resultado e
// mede o tempo (RTO). Nunca restaura por cima de um banco com dados.
//
//   DESTINO_DATABASE_URL="postgresql://.../restauracao_teste" \
//     npm run db:restaurar-isolado -- backups/sysbelt-<data>.dump
//
// Grava backups/restauracao-<data>.json com o relatório. Ver
// docs/backup-restauracao.md.

import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { pathToFileURL } from "node:url";

import { config } from "dotenv";

import { conferirVersaoDoPgDump, exigirUrl, falhar, sha256DoArquivo } from "./backup.mjs";

// Carrega o .env só para conhecer o banco de produção (DATABASE_URL) e
// recusar restaurar em cima dele; nada daqui é usado como destino.
config({ quiet: true });

// Tabelas cuja contagem entra no relatório: as que dizem se a academia
// voltou inteira (cadastro, financeiro e o vínculo de cada conta).
const TABELAS_CONFERIDAS = ["Conta", "Unidade", "Usuario", "Aluno", "Mensalidade", "Turma", "ConcessaoPlataforma"];

/** Mesmo servidor e mesmo banco: restaurar ali seria sobrescrever a origem. */
export function mesmoBanco(a, b) {
  return a.hostname === b.hostname && (a.port || "5432") === (b.port || "5432") && a.pathname === b.pathname;
}

function consultar(url, sql) {
  const resultado = spawnSync("psql", [url.href, "-v", "ON_ERROR_STOP=1", "-tAc", sql], { encoding: "utf8" });
  if (resultado.status !== 0) falhar(`Consulta falhou no destino:\n${resultado.stderr.trim()}`);
  return resultado.stdout.trim();
}

async function main() {
  const arquivo = process.argv[2];
  if (!arquivo || !existsSync(arquivo)) falhar("Informe o arquivo .dump: npm run db:restaurar-isolado -- <arquivo.dump>");
  const destino = exigirUrl("DESTINO_DATABASE_URL");

  for (const nome of ["DATABASE_URL", "DIRECT_DATABASE_URL", "ORIGEM_DATABASE_URL"]) {
    const valor = process.env[nome];
    if (valor && mesmoBanco(destino, new URL(valor))) {
      falhar(`DESTINO_DATABASE_URL aponta para o mesmo banco de ${nome}. A restauração é sempre num banco separado.`);
    }
  }

  const checksum = `${arquivo}.sha256`;
  if (existsSync(checksum)) {
    const esperado = readFileSync(checksum, "utf8").split(/\s+/)[0];
    if ((await sha256DoArquivo(arquivo)) !== esperado) falhar("O checksum do backup não confere: arquivo corrompido ou alterado.");
    console.log("Checksum do backup conferido.");
  } else {
    console.warn("Aviso: sem .sha256 ao lado do backup; integridade do arquivo não conferida.");
  }

  conferirVersaoDoPgDump(destino);
  const tabelasExistentes = Number(consultar(destino, "SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public'"));
  if (tabelasExistentes > 0) {
    falhar(`O banco de destino já tem ${tabelasExistentes} tabela(s). Use um banco vazio (no Neon, um branch novo; local, createdb).`);
  }

  const inicio = Date.now();
  const restauracao = spawnSync("pg_restore", ["--no-owner", "--no-privileges", "--exit-on-error", `--dbname=${destino.href}`, arquivo], {
    encoding: "utf8",
  });
  if (restauracao.status !== 0) falhar(`pg_restore falhou:\n${restauracao.stderr.trim()}`);
  const segundosRestauracao = (Date.now() - inicio) / 1000;

  // As migrations do código atual batem com o schema restaurado?
  const migrations = spawnSync("npx", ["prisma", "migrate", "status"], {
    encoding: "utf8",
    env: { ...process.env, DATABASE_URL: destino.href, DIRECT_DATABASE_URL: destino.href },
  });
  const migrationsEmDia = migrations.status === 0 && /up to date/i.test(migrations.stdout);

  const contagens = Object.fromEntries(
    TABELAS_CONFERIDAS.map((tabela) => [tabela, Number(consultar(destino, `SELECT count(*) FROM "${tabela}"`))]),
  );
  // Isolamento por conta: toda unidade e todo aluno continuam presos a uma
  // conta existente (as FKs garantem; a consulta prova que vieram juntas).
  const orfaos = Number(consultar(destino, `
    SELECT (SELECT count(*) FROM "Unidade" u LEFT JOIN "Conta" c ON c.id = u."contaId" WHERE c.id IS NULL)
         + (SELECT count(*) FROM "Aluno" a LEFT JOIN "Unidade" u ON u.id = a."unidadeId" WHERE u.id IS NULL)`));

  const relatorio = {
    executadoEm: new Date().toISOString(),
    backup: arquivo,
    destino: `${destino.hostname}${destino.pathname}`,
    segundosRestauracao: Number(segundosRestauracao.toFixed(1)),
    segundosTotal: Number(((Date.now() - inicio) / 1000).toFixed(1)),
    migrationsEmDia,
    contagens,
    registrosOrfaos: orfaos,
    aprovado: migrationsEmDia && orfaos === 0 && contagens.Conta > 0,
  };
  const saida = join(dirname(arquivo), `restauracao-${relatorio.executadoEm.replace(/[:.]/g, "-")}.json`);
  writeFileSync(saida, `${JSON.stringify(relatorio, null, 2)}\n`);

  console.log(JSON.stringify(relatorio, null, 2));
  console.log(`\nRelatório: ${saida}`);
  if (!relatorio.aprovado) falhar("Restauração com problema: veja migrationsEmDia, registrosOrfaos e contagens acima.");
  console.log(`Restauração aprovada em ${relatorio.segundosTotal} s.`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await main();
}
