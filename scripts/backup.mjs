// Backup lógico do banco (pg_dump, formato custom) com checksum.
//
//   ORIGEM_DATABASE_URL="postgresql://...sem -pooler..." npm run db:backup
//
// Gera backups/sysbelt-<data>.dump e o .sha256 ao lado. É a cópia
// independente do provedor: o histórico/PITR do Neon cobre a maior parte
// dos incidentes, mas não um problema com a própria conta do Neon. Ver
// docs/backup-restauracao.md.

import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { createReadStream, mkdirSync, statSync, writeFileSync } from "node:fs";
import { basename, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

export function falhar(mensagem) {
  console.error(`\n${mensagem}\n`);
  process.exit(1);
}

export function exigirUrl(nome) {
  const valor = process.env[nome]?.trim();
  if (!valor) falhar(`${nome} não definida.`);
  try {
    return new URL(valor);
  } catch {
    return falhar(`${nome} não é uma URL válida.`);
  }
}

export function versaoMaior(texto) {
  const numero = Number(String(texto).match(/(\d+)(?:\.\d+)?/)?.[1]);
  return Number.isFinite(numero) ? numero : null;
}

/** pg_dump mais antigo que o servidor recusa o dump (ou gera um incompleto). */
export function conferirVersaoDoPgDump(url) {
  const cliente = spawnSync("pg_dump", ["--version"], { encoding: "utf8" });
  if (cliente.error) falhar("pg_dump não encontrado. No Mac: brew install libpq && brew link --force libpq");
  const servidor = spawnSync("psql", [url.href, "-tAc", "SHOW server_version"], { encoding: "utf8" });
  if (servidor.status !== 0) falhar(`Não foi possível conectar ao banco:\n${servidor.stderr.trim()}`);
  const [versaoCliente, versaoServidor] = [versaoMaior(cliente.stdout), versaoMaior(servidor.stdout)];
  if (versaoCliente !== null && versaoServidor !== null && versaoCliente < versaoServidor) {
    falhar(`pg_dump ${versaoCliente} é mais antigo que o servidor (PostgreSQL ${versaoServidor}). Atualize o cliente (brew upgrade libpq).`);
  }
  return { versaoCliente, versaoServidor };
}

export async function sha256DoArquivo(caminho) {
  const hash = createHash("sha256");
  for await (const pedaco of createReadStream(caminho)) hash.update(pedaco);
  return hash.digest("hex");
}

async function main() {
  const origem = exigirUrl("ORIGEM_DATABASE_URL");
  // O pooler do Neon (PgBouncer em modo transação) não sustenta a sessão
  // longa do pg_dump: use a conexão direta.
  if (origem.hostname.includes("-pooler")) {
    falhar("Use a conexão direta do Neon (hostname sem -pooler), a mesma de DIRECT_DATABASE_URL.");
  }
  conferirVersaoDoPgDump(origem);

  const pasta = resolve(process.env.PASTA_BACKUP ?? "backups");
  mkdirSync(pasta, { recursive: true });
  const carimbo = new Date().toISOString().replace(/[:.]/g, "-");
  const arquivo = join(pasta, `sysbelt-${carimbo}.dump`);

  const inicio = Date.now();
  const dump = spawnSync("pg_dump", ["--format=custom", "--no-owner", "--no-privileges", `--file=${arquivo}`, origem.href], {
    encoding: "utf8",
  });
  if (dump.status !== 0) falhar(`pg_dump falhou:\n${dump.stderr.trim()}`);
  const segundos = ((Date.now() - inicio) / 1000).toFixed(1);

  const sha256 = await sha256DoArquivo(arquivo);
  writeFileSync(`${arquivo}.sha256`, `${sha256}  ${basename(arquivo)}\n`);

  const megabytes = (statSync(arquivo).size / 1024 / 1024).toFixed(2);
  console.log(`Backup gravado: ${arquivo}`);
  console.log(`Tamanho: ${megabytes} MB | duração: ${segundos} s | sha256: ${sha256}`);
  console.log("Guarde o .dump e o .sha256 fora desta máquina (ex.: armazenamento com versão e acesso restrito).");
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await main();
}
