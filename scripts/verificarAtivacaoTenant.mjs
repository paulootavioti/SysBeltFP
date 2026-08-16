import { pathToFileURL } from "node:url";

const FASES = new Set(["configuracao", "habilitada", "obrigatoria"]);

export function validarReadinessTenant(corpo, fase) {
  if (!FASES.has(fase)) throw new Error(`Fase inválida: ${fase}.`);
  if (!corpo || corpo.service !== "tenant-resolution") {
    throw new Error("A URL não respondeu como o health check de tenant resolution.");
  }
  if (!corpo.configuracaoValida || !corpo.awsConfigurada || !corpo.prontaParaAtivar) {
    throw new Error("Configuração de tenant resolution incompleta.");
  }

  if (fase === "configuracao" && corpo.status !== "legacy") {
    throw new Error("Na fase configuração, o serviço deve permanecer em modo legacy.");
  }
  if (fase === "habilitada" && (!corpo.habilitada || corpo.obrigatoria || corpo.status !== "ready")) {
    throw new Error("Na fase habilitada, ENABLED deve estar true e REQUIRED deve permanecer false.");
  }
  if (fase === "obrigatoria" && (!corpo.habilitada || !corpo.obrigatoria || corpo.status !== "ready")) {
    throw new Error("Na fase obrigatória, ENABLED e REQUIRED devem estar true.");
  }

  return { fase, status: corpo.status, habilitada: corpo.habilitada, obrigatoria: corpo.obrigatoria };
}

function argumentos(argv) {
  const fase = argv.find((arg) => arg.startsWith("--fase="))?.slice(7) ?? "configuracao";
  const urlBase = argv.find((arg) => !arg.startsWith("--")) ?? process.env.TENANT_HEALTH_URL;
  if (!urlBase) throw new Error("Informe a URL base do Tenant Plane.");

  const url = new URL("/health/tenant-resolution", urlBase);
  if (url.protocol !== "https:" && !["localhost", "127.0.0.1"].includes(url.hostname)) {
    throw new Error("Use HTTPS fora do ambiente local.");
  }
  return { fase, url };
}

export async function executarPreflight(argv = process.argv.slice(2), requisicao = fetch) {
  const { fase, url } = argumentos(argv);
  const resposta = await requisicao(url, { signal: AbortSignal.timeout(10_000) });
  let corpo;
  try { corpo = await resposta.json(); } catch { throw new Error("Health check retornou JSON inválido."); }
  if (!resposta.ok) throw new Error(`Health check indisponível (HTTP ${resposta.status}).`);
  return validarReadinessTenant(corpo, fase);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  executarPreflight()
    .then((resultado) => console.log(`Preflight aprovado: ${JSON.stringify(resultado)}`))
    .catch((erro) => { console.error(`Preflight reprovado: ${erro.message}`); process.exitCode = 1; });
}
